import { defineConfig } from 'vitest/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadDevVars() {
  const envVars: Record<string, string> = {}
  try {
    const devVarsPath = resolve(__dirname, '.dev.vars')
    const content = readFileSync(devVarsPath, 'utf-8')
    content.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
  } catch (error) {
    console.warn('Could not load .dev.vars file:', error)
  }
  return envVars
}

export default defineConfig({
  test: {
    env: loadDevVars(),
    include: ['**/*.eval.ts'],
    testTimeout: 30000,
  },
})
