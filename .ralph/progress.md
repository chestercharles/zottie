# zottie Development Progress

See `.ralph/history/completed-progress.md` for completed features.

## Current Next Steps

- None - all PRD items completed

## Recently Completed

### Deleting a pantry item should only be possible from the item detail page

**Frontend (Mobile) changes:**
- Removed delete action from pantry list swipe actions in `PantryListScreen.tsx`:
  - **Staple items**: Swipe left now reveals only "Low" (orange) and "Out" (red) buttons
  - **Planned items**: Swipe left now reveals only "More" (blue) button
  - Adjusted swipe action widths from 180/120px to 120/60px
- Removed "Delete Item" option from both `ActionSheetIOS` menus:
  - Staple action sheet now shows: "Mark as Running Low", "Mark as Out of Stock"
  - Planned action sheet now shows: "Mark as Running Low", "Finished - Convert to Staple"
- Removed "Finished - Remove from Pantry" option (was a delete operation)
- Removed `useDeletePantryItem` import and usage from `PantryListScreen`
- Delete functionality remains in `PantryItemDetailScreen.tsx`:
  - Red "Delete Item" button at bottom of item detail page
  - Confirmation dialog before deleting with Cancel/Delete options
  - Navigates back to pantry list after successful deletion

**Testing:**
- TypeScript compilation successful
- Mobile linting passing

### Native iOS swipe actions for shopping list

**Frontend (Mobile) changes:**
- Added `ReanimatedSwipeable` from `react-native-gesture-handler/ReanimatedSwipeable` to `ShoppingListScreen`
- Created `SwipeActionButton` component with animated scale/opacity effects matching pantry implementation
- Wrapped `ShoppingItemRow` with swipeable functionality
- Swipe left reveals two action buttons:
  - **Purchased** (green, checkmark-circle icon): Marks single item as purchased immediately
  - **Delete** (red, trash icon): Removes the item from the list
- Added haptic feedback using `expo-haptics`:
  - Medium impact when tapping "Purchased" button
  - Heavy impact when tapping "Delete" button
  - Success notification feedback on full-swipe action
- Implemented full-swipe gesture to execute primary action (mark as purchased) without requiring tap
- The existing checkbox pattern remains for batch operations; swipe provides quick single-item action
- Imported `useDeletePantryItem` from pantry hooks for delete functionality

**New styles added:**
- `swipeActionsContainer`, `swipeActionButton`, `swipeActionContent`, `swipeActionLabel`

**Testing:**
- TypeScript compilation successful
- Mobile linting passing

### Migrate pantry list to FlatList

**Frontend (Mobile) changes:**
- Replaced `ScrollView` with `FlatList` in `PantryListScreen` for improved scroll performance
- Extracted `renderItem` callback for FlatList's render pattern with proper memoization using `useCallback`
- Moved the collapsible planned items section to `ListHeaderComponent` via `renderListHeader` callback
- Maintained the existing planned items collapsible behavior within the header component
- Pull-to-refresh continues to work with `RefreshControl` passed to FlatList
- Search input remains as a separate component above the FlatList (not part of the list)

**Testing:**
- TypeScript compilation successful
- Mobile linting passing

### Native iOS swipe actions for pantry list

**Frontend (Mobile) changes:**
- Replaced deprecated `Swipeable` with `ReanimatedSwipeable` from `react-native-gesture-handler/ReanimatedSwipeable`
- Refactored `PantryItemRow` component with native iOS-style swipe actions:
  - **Staple items**: Swipe left reveals "Low" (orange), "Out" (red), and "Delete" (dark red) action buttons
  - **Planned items**: Swipe left reveals "More" (blue) and "Delete" (red) action buttons
  - Each button has an icon and short label, similar to iOS Mail
- Added haptic feedback using `expo-haptics`:
  - Medium impact when tapping "Low" or "Out" buttons
  - Heavy impact when tapping "Delete" button
  - Light impact when tapping "More" button
  - Success notification feedback on full-swipe action
- Implemented full-swipe gesture to execute primary action (mark as running low) without requiring tap
- Created animated `SwipeActionButton` component that scales and fades in as user swipes
- Kept `ActionSheetIOS` accessible via "More" button for planned items (less common actions)
- Added new styles: `swipeActionsContainer`, `swipeActionButton`, `swipeActionContent`, `swipeActionLabel`

**Testing:**
- TypeScript compilation successful
- Mobile linting passing

### iOS-style bottom sheet for adding shopping list items

**Frontend (Mobile) changes:**
- Updated `ShoppingListScreen` in `features/shopping/ShoppingListScreen.tsx`:
  - Added `@gorhom/bottom-sheet` for the add-item sheet
  - Added `+` button in header bar using `useNavigation().setOptions()`
  - Created full-screen bottom sheet (90% snap point) with iOS Calendar style header:
    - X button (close icon) in top left to dismiss
    - Centered "Add Planned Item" title
    - Checkmark button in top right to add (purple #9B59B6, disabled when input empty)
  - Sheet uses `BottomSheetTextInput` with autoFocus for keyboard-aware input
  - Sheet dismissible by swiping down or tapping backdrop
- Removed inline `AddPlannedItemInput` component from list header
- Updated empty state to show "Add Planned Item" button that opens sheet
- Added styles: `sheetContent`, `sheetHandle`, `sheetHeader`, `sheetHeaderButton`, `sheetHeaderButtonDisabled`, `sheetTitle`, `sheetBody`, `sheetInput`, `addButton`, `addButtonText`

**Testing:**
- TypeScript compilation successful
- Mobile linting passing

### Full-screen add item sheet for pantry (iOS Calendar style)

**Frontend (Mobile) changes:**
- Transformed bottom sheet from partial to full-screen layout in `features/pantry/PantryListScreen.tsx`
- Added iOS Calendar-style header with:
  - X button (close icon) in top left to dismiss the sheet
  - Centered "Add Item" title
  - Checkmark button in top right to add the item (replaces bottom Add button)
  - Checkmark shows disabled state (gray) when input is empty
- Removed old elements: sheet handle, bottom Add button
- Updated animations to slide from full screen height instead of 300px
- Replaced `KeyboardAvoidingView` with simpler `View` wrapper (full-screen sheet handles keyboard naturally)
- Updated styles: `sheetWrapper`, `sheetHeader`, `sheetHeaderButton`, `sheetHeaderButtonDisabled`, `sheetBody`

**Testing:**
- TypeScript compilation successful
- Mobile linting passing


### iOS-style bottom sheet for adding pantry items

**Frontend (Mobile) changes:**
- Updated `PantryListScreen` in `features/pantry/PantryListScreen.tsx`:
  - Added bottom sheet modal using React Native's `Modal` component with `animationType="slide"`
  - Sheet contains: item name input (autofocused), status selector with "In Stock" (default), "Running Low", "Out of Stock" options, and "Add" button
  - Sheet dismissible by tapping backdrop
  - Added `KeyboardAvoidingView` for proper keyboard handling on iOS
  - Uses `useCreatePantryItem` hook for creating items
- Added `+` button in header bar next to settings icon using `useNavigation().setOptions()`
- Removed FAB (floating action button) from bottom of screen
- Updated empty state "Add Item" button to open bottom sheet instead of navigating to `/pantry/create`
- Simplified `_layout.tsx` - removed static `headerRight` since it's now set dynamically

**New styles added:**
- `modalContainer`, `backdrop`, `sheet`, `sheetHandle`, `sheetTitle`
- `sheetInput`, `sheetLabel`, `sheetStatusContainer`, `sheetStatusButton`, `sheetStatusButtonActive`
- `sheetStatusButtonText`, `sheetStatusButtonTextActive`, `sheetAddButton`, `sheetAddButtonDisabled`, `sheetAddButtonText`

**Testing:**
- TypeScript compilation successful
- Mobile linting passing

### Swipe actions for quick status changes on pantry items

**Backend (API) changes:**
- Updated `PantryItemUpdate` schema in `src/types.ts` to include optional `itemType` field
- Updated `PantryItemUpdateEndpoint` in `src/endpoints/pantryItemUpdate.ts`:
  - Now accepts `itemType` in request body
  - Imports `PantryItemType` type from db schema
  - Updates itemType when provided in request

**Frontend (Mobile) changes:**
- Updated `UpdatePantryItemRequest` type to include optional `itemType`
- Updated `useUpdatePantryItem` hook to accept `itemType` parameter
- Updated `PantryListScreen` with swipe actions:
  - Added `Swipeable` from `react-native-gesture-handler` to `PantryItemRow` component
  - Swipe left reveals an action button (ellipsis icon)
  - Tapping action button opens iOS-native action sheet via `ActionSheetIOS`
  - **Staple items** show: "Mark as Running Low", "Mark as Out of Stock", "Delete Item"
  - **Planned items** show: "Mark as Running Low", "Finished - Remove from Pantry", "Finished - Convert to Staple", "Delete Item"
  - "Convert to Staple" changes item type to 'staple' and sets status to 'out_of_stock' so it appears on shopping list
- Added `swipeAction` style for the swipe button (blue background, rounded)

**Testing:**
- All API tests passing (46 tests)
- TypeScript compilation successful for both API and mobile
- Mobile linting passing

### Visual indicator distinguishes planned items from staples

**Frontend (Mobile) changes:**
- Updated `PantryItemRow` component in `features/pantry/PantryListScreen.tsx`
- Added `Ionicons` import from `@expo/vector-icons`
- Added a small pricetag icon (`pricetag-outline`) next to item names for planned items in the main list
- Icon only displays when `itemType === 'planned'` AND `status !== 'planned'` (purchased planned items)
- Items in the collapsible "Planned Items" section do not show the icon (already visually grouped)
- Icon is subtle: 14px size, purple (#9B59B6) color with 0.8 opacity
- Added `itemNameContainer` style for flex row layout with gap

**Testing:**
- TypeScript compilation successful
- Mobile linting passing

### Leave a household

**Backend (API) changes:**
- Created `HouseholdLeaveEndpoint` at `POST /api/household/leave`
- Endpoint removes user from current household membership
- Creates a new empty household for the user with default name "My Household"
- If user was the last member, permanently deletes the old household and all its data (pantry items, invites)

**Frontend (Mobile) changes:**
- Added `leaveHousehold` API function in `features/household/api.ts`
- Added `LeaveHouseholdResponse` type in `features/household/types.ts`
- Created `useLeaveHousehold` hook with React Query mutation
  - Invalidates household, householdMembership, and pantryItems queries on success
- Updated `SettingsScreen`:
  - Added "Leave Household" button below members list (red styling with exit icon)
  - Confirmation dialog shows context-aware message:
    - If only member: warns about permanent data deletion
    - If other members exist: explains they'll lose access to shared pantry
  - Button shows "Leaving..." state while processing

**Testing:**
- TypeScript compilation successful for both API and mobile
- Mobile linting passing
