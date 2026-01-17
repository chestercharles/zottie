You are working on the design system reimplementation for the zottie mobile app.

## Context

Read these files to understand the work:
- `apps/mobile/DESIGN_SYSTEM.md` - The target design system specification
- `apps/mobile/DESIGN_SYSTEM_REFACTOR_PLAN.md` - The phased implementation plan with checkboxes

## Workflow

1. **Check progress**: Read `apps/mobile/.design-refactor-progress.md` to see what was done in previous sessions.

2. **Find next task**: Read `apps/mobile/DESIGN_SYSTEM_REFACTOR_PLAN.md` and find the next unchecked `[ ]` item. Work through phases in order (complete Phase 1 before Phase 2, etc).

3. **Implement the task**: Make the necessary code changes. Follow the design system spec exactly. Use semantic tokens, not hardcoded values.

4. **Verify changes**:
   - Run `pnpm run lint` from `apps/mobile`
   - Run `pnpm run tsc` from `apps/mobile`
   - Run `pnpm run test` from `apps/mobile`

5. **Update progress**:
   - Mark the item as `[x]` in `DESIGN_SYSTEM_REFACTOR_PLAN.md`
   - Update the Progress Tracking table counts
   - Append a summary to `apps/mobile/.design-refactor-progress.md` with:
     - Date
     - What was completed
     - Files changed
     - Any decisions made or issues encountered

6. **Commit**: Make a git commit with a descriptive message.

## Rules

- Work on ONE TASK at a time
- Do not skip ahead to later phases until earlier phases are complete
- If a task is blocked by a question or decision, note it in the progress file and ask for clarification
- Follow the design system spec exactly - when in doubt, choose the calmer option
- Do not add features or improvements beyond what the task requires

## Progress File Format

The progress file (`apps/mobile/.design-refactor-progress.md`) should look like:

```markdown
# Design System Refactor Progress

## Session: [date]

### Completed
- [x] Task description

### Files Changed
- path/to/file.tsx

### Notes
Any relevant decisions, issues, or context for future sessions.

---
```

Each session appends a new section at the top (newest first).
