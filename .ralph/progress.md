# zottie Development Progress

## 2026-01-17: Fix item name alignment on edit item screen

**Feature:** Aligned the item name on the edit item screen with the content inside the Card sections below it

**Changes:**

- Added `paddingHorizontal: spacing.md` to the header section in `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`

**Technical Details:**

The item name was misaligned because it sat directly inside the content wrapper (with `padding: spacing.md`), while the sections below used `Card` components that add their own internal `padding: spacing.md`. This meant the item name was `spacing.md` from the screen edge, while Card content was `spacing.md + spacing.md` from the edge.

The fix adds matching horizontal padding to the header section so the item name aligns with the text inside the Cards below it.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Add confirmation before marking items as purchased

**Feature:** Added a confirmation alert before marking checked items as purchased in the shopping list

**Changes:**

- Updated `handleMarkAsPurchased` in `apps/mobile/features/shopping/ShoppingListScreen.tsx`:
  - Added an `Alert.alert` confirmation dialog before executing the mark as purchased action
  - Alert shows the number of items being marked (e.g., "Mark 3 items as purchased?")
  - Provides context: "They'll be moved to your pantry as in-stock."
  - Two-button design following iOS HIG: "Cancel" (default) and "Mark Purchased"

**Technical Details:**

Following iOS Human Interface Guidelines for confirmation patterns:

1. Two-button alerts provide an easy choice between two alternatives
2. Cancel button is listed first, making it the default (bold) option per iOS convention
3. Action button uses a clear verb phrase ("Mark Purchased") that describes the result
4. Message explains what will happen to help users make an informed decision

This prevents accidental taps on the cart icon in the header from immediately marking items as purchased, giving users a chance to confirm their intent.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Move Mark as Purchased action to header

**Feature:** Relocated the "Mark as Purchased" button from the bottom of the shopping list to the navigation header

**Changes:**

- Updated `apps/mobile/features/shopping/ShoppingListScreen.tsx`:
  - Added cart icon with badge to the header right section that appears when items are checked
  - Badge shows the count of checked items
  - Removed the large bottom "Mark as Purchased" button container
  - Kept the "Reset checkmarks" option in a simpler bottom container
  - Added new styles for header elements (`headerRight`, `headerPurchaseButton`, `headerBadge`, `headerBadgeText`)
  - Wrapped `handleMarkAsPurchased` in `useCallback` for proper dependency handling
  - Moved `useLayoutEffect` for header options to after `checkedCount` is defined

**Technical Details:**

The previous implementation showed a large green "Mark as Purchased" button at the bottom of the screen whenever items were checked. This was too prominent and obstructed scrolling while actively shopping.

The new implementation:

1. Shows a cart icon with a green badge (showing checked count) in the header next to the add button
2. Cart icon only appears when at least one item is checked
3. Tapping the cart icon triggers the mark as purchased flow
4. Shows loading indicator in place of the cart icon during the mutation
5. Keeps the "Reset checkmarks" link at the bottom for users who want to uncheck all items

This follows iOS design patterns where primary actions are placed in the navigation header rather than floating at the bottom.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Remove redundant status display on edit item page

**Feature:** Removed the redundant status badge from the edit item page

**Changes:**

- Removed `<StatusBadge status={currentStatus} />` from the header section in `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`
- Removed unused `StatusBadge` import

**Technical Details:**
The edit item page was showing the item's status twice:

1. A `StatusBadge` component displayed below the item name in the header
2. The status picker section below with the current status highlighted

This was redundant since users could already see their current status highlighted in the status picker. Removing the standalone StatusBadge simplifies the UI and eliminates the duplication.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Fix edit item sheet handle position

**Feature:** Positioned the drag handle above the "Edit Item" title to match the Settings page pattern

**Changes:**

- Updated `apps/mobile/app/(authenticated)/pantry/_layout.tsx` to set `headerShown: false` for the `[id]` screen
- Added a custom "Edit Item" header in `apps/mobile/features/pantry/PantryItemDetailScreen.tsx` below the DragHandle
- Added `sheetHeader` style for centered alignment

**Technical Details:**
The edit item screen was using the default Stack navigation header which placed the "Edit Item" title above the DragHandle component rendered inside the screen. This was inconsistent with the Settings page, which uses `headerShown: false` and renders a custom header below the DragHandle.

The fix follows the Settings page pattern:

1. Hide the Stack navigation header
2. Render DragHandle at the very top of the screen
3. Render a custom centered header with the title below the DragHandle

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Auto-sort checked shopping list items to bottom

**Feature:** Checked shopping list items now automatically move to the bottom of the list

**Changes:**

- Added `sortedItems` memoized value in `apps/mobile/features/shopping/ShoppingListScreen.tsx`
- Sorting logic separates items into two groups: unchecked items (shown first) and checked items (shown last)
- Both groups maintain their original alphabetical order from the API
- Updated `FlatList` to render `sortedItems` instead of `items`

**Technical Details:**

- Uses `useMemo` to efficiently recompute the sorted list only when `items` or `checkedIds` change
- Maintains alphabetical order within each group (unchecked and checked)
- Mirrors iOS Notes app behavior for shopping list organization
- When users check items while shopping, they automatically move to the bottom keeping unchecked items prominently visible at the top

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Clear search filter when dismissing search box

**Feature:** Fixed pantry search dismiss behavior to properly clear search filter

**Changes:**

- Refactored `toggleSearchMode` function in `apps/mobile/features/pantry/PantryListScreen.tsx` to separate concerns
- Created `openSearchMode()` and `closeSearchMode()` functions for explicit state control
- Updated `closeSearchMode()` to properly clear both the search mode state and search term when dismissing
- Updated SearchOverlay to use `closeSearchMode` instead of toggle for the dismiss button
- Maintained backward compatibility by keeping `toggleSearchMode` for the header search button

**Technical Details:**
The issue was that the previous implementation called `setSearchTerm('')` inside the `setIsSearchMode` state updater callback, which could cause timing issues with React's state batching. The new implementation explicitly calls both state updates in sequence when closing search mode, ensuring the search filter is always cleared when the user dismisses the search box.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed
