#!/usr/bin/env node
// PR-native-changes-check gate for Expo (zero deps, no LLM).
// Policy:
// - If package.json "version" changed (runtime bumped) -> PASS immediately.
// - Else, if likely native-impacting changes -> FAIL (ask to bump runtime version).
// - Else -> PASS.

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const process = require('node:process')

// ---------- args ----------
const args = process.argv.slice(2)
const getArg = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? String(args[i + 1]) : def
}
const RANGE = getArg('range', '') // "<base>...<head>"
if (!RANGE || !RANGE.includes('...')) {
  console.error('❌ Missing or invalid --range "<base>...<head>"')
  process.exit(2)
}
const [BASE, HEAD] = RANGE.split('...')

// ---------- config ----------
const HIGH_SIGNAL = [
  'app.config.js',
  'app.config.ts',
  'app.config.json',
  'app.json',
  'eas.json',
]
const NATIVE_DEP_HINTS = [
  /^react-native($|[-/])/,
  /^@react-native\//,
  /^expo($|[-/])/,
  /^expo-.+/,
  /^@expo\//,
  /^react-native-gesture-handler/,
  /^react-native-reanimated/,
  /^react-native-vision-camera/,
  /^react-native-mmkv/,
  /^@react-navigation\//,
  /^@shopify\/react-native-/,
]

// ---------- helpers ----------
function sh(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}
function fileAt(ref, path) {
  try {
    return execSync(`git show ${ref}:${path}`, { encoding: 'utf8' })
  } catch {
    return undefined
  }
}
function parseJSONSafe(s) {
  try {
    return JSON.parse(s)
  } catch {
    return undefined
  }
}
function changedFiles(range) {
  const cmd = `git diff --name-only ${range} -- . ":(exclude)**/node_modules/**" ":(exclude)**/.expo/**" ":(exclude)**/dist/**" ":(exclude)**/build/**"`
  const out = sh(cmd)
  return out
    ? out
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
}
function diffDeps(a = {}, b = {}) {
  const names = new Set([...Object.keys(a), ...Object.keys(b)])
  const added = [],
    removed = [],
    changed = []
  for (const n of names) {
    const va = a[n],
      vb = b[n]
    if (va === undefined && vb !== undefined) added.push([n, vb])
    else if (va !== undefined && vb === undefined) removed.push([n, va])
    else if (va !== vb) changed.push([n, va, vb])
  }
  return { added, removed, changed }
}

// ---------- main ----------
function main() {
  // Read package.json before/after
  const basePkgStr = fileAt(BASE, 'package.json')
  const headPkgStr =
    fileAt(HEAD, 'package.json') || fs.readFileSync('package.json', 'utf8')
  const basePkg = parseJSONSafe(basePkgStr || '')
  const headPkg = parseJSONSafe(headPkgStr || '')

  const baseVersion = basePkg?.version
  const headVersion = headPkg?.version

  // 0) Short-circuit: runtime bumped -> PASS
  if (baseVersion !== headVersion) {
    console.log(
      '\x1b[32m✅ Runtime version bumped in package.json — check passes.\x1b[0m'
    )
    console.log(
      `   version: ${baseVersion || '(none)'} → ${headVersion || '(none)'}`
    )
    // Optional: surface summary in Actions UI
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `### Native Changes Check\n\n- ✅ Runtime bumped: \`${baseVersion || '(none)'} → ${headVersion || '(none)'}\`\n`
      )
    }
    process.exit(0)
  }

  // Otherwise evaluate “should have bumped?”
  const files = changedFiles(RANGE)

  // 1) High-signal config files
  const highHits = files.filter((f) => HIGH_SIGNAL.some((h) => f.endsWith(h)))
  if (highHits.length) {
    console.log(
      '\x1b[31m❌ Native-impacting config change detected, but runtime version was NOT bumped.\x1b[0m'
    )
    highHits.forEach((f) => console.log(`  • ${f}`))
    console.log(
      '\nAction: Bump \x1b[1mpackage.json.version\x1b[0m (runtimeVersion policy: appVersion) and push to this PR.'
    )
    writeSummaryFail({
      baseVersion,
      headVersion,
      reasons: highHits.map((f) => `Changed high-signal file: \`${f}\``),
    })
    process.exit(1)
  }

  // 2) package.json deps / RN / Expo deltas
  const baseDeps = {
    ...(basePkg?.dependencies || {}),
    ...(basePkg?.devDependencies || {}),
  }
  const headDeps = {
    ...(headPkg?.dependencies || {}),
    ...(headPkg?.devDependencies || {}),
  }
  const delta = diffDeps(baseDeps, headDeps)

  const baseExpo = baseDeps['expo']
  const headExpo = headDeps['expo']
  const baseRN = baseDeps['react-native']
  const headRN = headDeps['react-native']
  const rnOrExpoChanged =
    (baseExpo !== headExpo && (baseExpo || headExpo)) ||
    (baseRN !== headRN && (baseRN || headRN))

  const reasons = []
  if (rnOrExpoChanged) {
    if (baseExpo !== headExpo)
      reasons.push(
        `Expo version changed: \`${baseExpo || '(none)'} → ${headExpo || '(none)'}\``
      )
    if (baseRN !== headRN)
      reasons.push(
        `React Native version changed: \`${baseRN || '(none)'} → ${headRN || '(none)'}\``
      )
  }

  const depsChanged =
    delta.added.length || delta.removed.length || delta.changed.length
  if (depsChanged) {
    reasons.push(
      `Dependencies changed: ${delta.added.length} added, ${delta.removed.length} removed, ${delta.changed.length} updated`
    )
    const touched = [
      ...delta.added.map(([n]) => n),
      ...delta.removed.map(([n]) => n),
      ...delta.changed.map(([n]) => n),
    ]
    const nativeHints = touched.filter((n) =>
      NATIVE_DEP_HINTS.some((rx) => rx.test(n))
    )
    if (nativeHints.length)
      reasons.push(
        `Likely native-related packages touched: \`${Array.from(new Set(nativeHints)).join('`, `')}\``
      )
  }

  // Decision: if any of the above changed, the PR SHOULD have bumped runtime → FAIL
  const shouldHaveBumped = rnOrExpoChanged || depsChanged
  if (shouldHaveBumped) {
    console.log(
      '\x1b[31m❌ Native-impacting package changes detected, but runtime version was NOT bumped.\x1b[0m'
    )
    reasons.forEach((r) => console.log(`  • ${r}`))
    console.log(
      '\nAction: Bump \x1b[1mpackage.json.version\x1b[0m and push to this PR.'
    )
    writeSummaryFail({ baseVersion, headVersion, reasons })
    process.exit(1)
  }

  // PASS
  console.log(
    '\x1b[32m✅ No native-impacting changes found and runtime version unchanged — check passes.\x1b[0m'
  )
  writeSummaryPass({ baseVersion, headVersion })
  process.exit(0)
}

function writeSummaryFail({ baseVersion, headVersion, reasons }) {
  if (!process.env.GITHUB_STEP_SUMMARY) return
  const lines = [
    `### Native Changes Check — **Failed**`,
    ``,
    `- Runtime version unchanged: \`${baseVersion || '(none)'} → ${headVersion || '(none)'}\``,
    `- Native-impacting changes detected:`,
    ...reasons.map((r) => `  - ${r}`),
    ``,
    `**Action:** Bump \`package.json.version\` (runtimeVersion policy is \`appVersion\`) and push to this PR.`,
  ]
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
}
function writeSummaryPass({ baseVersion, headVersion }) {
  if (!process.env.GITHUB_STEP_SUMMARY) return
  const lines = [
    `### Native Changes Check — Passed`,
    ``,
    `- Runtime version: \`${baseVersion || '(none)'} → ${headVersion || '(none)'}\``,
    `- No gating changes detected.`,
  ]
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
}

try {
  main()
} catch (err) {
  console.error('❌ native-changes-check error:', err?.stack || err)
  process.exit(2)
}
