# zottie Development Progress

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

## 2026-01-17: Swipe-up gesture to dismiss pantry search (temporarily disabled)

**Status:** Temporarily disabled pending new development build

**Issue:** The swipe gesture implementation was causing the app to crash or close unexpectedly. The issue persisted even after removing haptic feedback, suggesting a potential incompatibility with the current development build or native gesture handler setup.

**Next Steps:**
- Create a new development build to ensure all native modules (expo-haptics, gesture-handler) are properly included
- Re-enable and test the swipe gesture implementation after the new build is ready

**Implementation Details (commented out):**
- Added pan gesture detection to the SearchOverlay component in `apps/mobile/features/pantry/PantryListScreen.tsx`
- Imported `Gesture` and `GestureDetector` from `react-native-gesture-handler`
- Created `gestureTranslateY` shared value to track vertical pan gestures
- Implemented pan gesture handler with:
  - `activeOffsetY([-8, 8])`: Requires 8pt vertical movement before activating
  - `failOffsetX([-15, 15])`: Fails if horizontal movement exceeds 15pt (prevents conflicts with text selection)
  - `onUpdate`: Tracks upward swipe movements (negative Y translations)
  - `onEnd`: Dismisses search if user swipes up more than 60px AND with velocity over 1000 (both conditions required)
  - Spring animation to snap back if gesture doesn't meet dismiss threshold
- Combined gesture translation with base animation for smooth transitions

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
