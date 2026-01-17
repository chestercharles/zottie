# zottie Development Progress

## 2026-01-17: Alphabetical Sorting for Pantry and Shopping List

Implemented alphabetical sorting (A-Z) for both the pantry screen and shopping list screen.

### Changes Made

**Pantry Items Hook** (`apps/mobile/features/pantry/hooks/usePantryItems.ts`)
- Added `.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))` to `mainListItems` computation
- Added the same sorting to `plannedItems` computation
- Both sections now display items in alphabetical order by item name

**Shopping Items Hook** (`apps/mobile/features/shopping/hooks/useShoppingItems.ts`)
- Added `.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))` to the `select` function
- Shopping list items now display in alphabetical order

### Technical Details

- Used case-insensitive sorting with `.toLowerCase()` to ensure consistent alphabetical ordering
- Used `.localeCompare()` for proper string comparison that respects alphabetical ordering
- Sorting is applied after filtering in all cases to ensure only visible items are sorted
- No backend changes required - sorting happens on the frontend in React hooks

### Verification

- Linting: Passed
- TypeScript compilation: Passed
- Tests: Passed (no test files exist yet)

### User Experience

Users can now quickly find items in both their pantry and shopping list by scanning alphabetically. When new items are added, they automatically appear in the correct alphabetical position rather than at the top or bottom of the list.
