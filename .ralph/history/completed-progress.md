# zottie Completed Development Progress

## 2026-01-13

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

## 2026-01-13

### Filter pantry items by search term

**Frontend (Mobile) changes:**

- Updated `usePantryItems` hook to accept optional `searchTerm` parameter
- Added `filteredItems` memoized value that filters items by name (case-insensitive)
- `mainListItems` and `plannedItems` now derive from filtered items
- Updated `PantryListScreen`:
  - Added search state managed by `useState`
  - Added search box at top of pantry list with `TextInput`
  - Clear button (X) appears when text is entered
  - Filters both main list and planned items section in real-time

**Testing:**

- TypeScript compilation successful
- Mobile linting passing

### Users should be able to log out from the onboarding screen

**Frontend (Mobile) changes:**

- Added logout button to `OnboardingScreen` component
- Button is positioned at the bottom of the screen using `marginTop: 'auto'`
- Shows confirmation dialog before logging out (same pattern as Settings)
- Clears React Query cache and calls `signOut()` from auth hook
- Button shows "Logging out..." state while processing

**Testing:**

- TypeScript compilation successful
- Mobile linting passing

### Settings page displays household info and members

**Backend (API) changes:**

- Added `email` and `name` columns directly to `householdMembers` table (simpler than separate users table)
- Auth middleware extracts `email` and `name` from JWT and makes them available in request context
- Household endpoints store email/name when member joins:
  - `householdCreate.ts`: Stores creator's email/name on membership record
  - `householdJoin.ts`: Stores joining user's email/name on membership record
  - `householdGet.ts` and `householdMembershipGet.ts`: Simple queries without joins
- Updated `getOrCreateHouseholdId` helper to accept email/name parameters

**Frontend (Mobile) changes:**

- Updated `HouseholdMember` interface with `email: string` and `name?: string`
- Enhanced `SettingsScreen`:
  - Displays list of household members below the invite button
  - Shows member name (if available) or email
  - Indicates current user with "You" label
  - Styled with person icons and clean list layout

**Testing:**

- All API tests passing (46 tests)
- TypeScript compilation successful for both API and mobile
- Mobile linting passing

### First-time user household onboarding flow

- Created `OnboardingScreen` component in `features/onboarding/`:
  - Shows welcome message with home icon
  - Text input for household name (required)
  - "Create Household" primary button using `useCreateHousehold` hook
  - Divider with "or"
  - "Join an Existing Household" section explaining invite link requirement
  - Loading state while creating, error handling for failures
  - Keyboard avoiding behavior for iOS
- Created route at `app/onboarding.tsx`:
  - Imports OnboardingScreen
  - Passes `onSuccess` callback that navigates to pantry
- Updated `app/index.tsx` to detect first-time users:
  - Uses `useHouseholdMembership` hook to check if user has a household
  - If authenticated but no household (and no pending invite), redirects to `/onboarding`
  - If has household, continues to pantry as before
  - Loading state shown while checking household membership
- Updated `app/_layout.tsx` to include onboarding route in Stack navigation
- Flow: Authenticated user without household → Onboarding screen → Create household → Navigate to pantry

## 2026-01-12

### Create a household (API changes for explicit creation)

- Created `POST /api/household` endpoint for explicit household creation:
  - Accepts `name` in request body
  - Creates household with the provided name
  - Adds the current user as a member
  - Returns 409 if user already belongs to a household
  - Returns 201 with household and member info on success
- Created `GET /api/household/membership` endpoint:
  - Returns user's household if they have one
  - Returns 404 if user has no household (no auto-creation)
  - This enables the onboarding flow to detect first-time users
- Modified `GET /api/household` to remove auto-creation behavior:
  - Now returns 404 if user has no household
  - No longer auto-creates a "My Household" on first access
- Added `HouseholdCreate` type to API types
- Updated mobile app with new API functions and hooks:
  - Added `createHousehold` API function
  - Added `getHouseholdMembership` API function (returns null on 404)
  - Created `useCreateHousehold` mutation hook
  - Created `useHouseholdMembership` query hook
  - Added `householdMembership` query key
- Updated all API tests to use POST /api/household for creating households
- Total test coverage now at 46 tests across 6 test files

### Existing user switches household via invite

- Updated `POST /api/household/join/:code` endpoint to allow household switching:
  - If user is already a member of the target household, returns success with `alreadyMember: true`
  - If user is a member of a different household, removes them from old household and adds to new one
  - Removed 409 conflict response for existing household members
- Added `householdId` to `HouseholdInviteInfo` type in both API and mobile app
- Updated `GET /api/household/invite/:code` to return `householdId` for comparison
- Updated `JoinScreen` component to handle three scenarios:
  - User is already a member of target household: shows "You're Already a Member" with checkmark icon
  - User is in a different household: shows "Switch Households?" with warning, confirmation dialog before switching
  - User has no household: shows normal "Join Household" flow
- Added `onCancel` prop to JoinScreen for navigation
- Updated join route to pass `onCancel` handler
- Updated `JoinHouseholdResponse` type to include optional `alreadyMember` flag
- Updated API tests:
  - Changed 409 test to test successful switch between households
  - Added test for `alreadyMember` flag when user is already in target household
  - Added test for `householdId` in validate invite response
- Total test coverage now at 40 tests across 6 test files

### Add missing household API tests

- Created `household.test.ts` with tests for GET and PATCH /api/household endpoints:
  - GET /api/household: 401 unauthorized, creates new household for new user, returns existing household
  - PATCH /api/household: 401 unauthorized, 404 when no household, updates name successfully, persists update
- Total test coverage now at 39 tests across 6 test files

### New user joins household via invite

- Created `POST /api/household/join/:code` backend endpoint:
  - Validates the invite code and checks expiration
  - Checks if user already belongs to a household (returns 409 if so)
  - Adds the user as a member of the target household
  - Returns household info and full member list
- Added `JoinHouseholdResponse` type to mobile app
- Created `joinHousehold` API function in mobile app
- Created `useJoinHousehold` React Query hook with cache invalidation
- Updated `JoinScreen` component:
  - Added `onJoinSuccess` callback prop
  - Shows "Join Household" button when invite is valid
  - Shows loading indicator while joining
  - Shows error alert if join fails
- Updated join route (`app/join/[code].tsx`):
  - Handles `onJoinSuccess` by clearing pending invite and navigating to pantry
  - Users skip the normal household onboarding flow after joining via invite
- Added 4 new e2e tests for the join endpoint:
  - 401 when no auth header
  - 404 for invalid invite code
  - Successful join with valid invite
  - 409 when user already has a household

### Handle invite deep links

- Created `validateInvite` API function to validate invite codes via `GET /api/household/invite/:code`
- Added `HouseholdInviteInfo` and `ValidateInviteResponse` types to mobile app
- Created `useValidateInvite` React Query hook to fetch and cache invite validation
- Added `householdInvite` query key to `lib/query/keys.ts`
- Created `JoinScreen` component in `features/household/`:
  - Shows loading state while validating invite
  - Shows error state for invalid/expired invites with icon and message
  - Shows success state with household name and expiry info for valid invites
  - Handles unauthenticated users with sign-in prompt
- Created route at `app/join/[code].tsx` for deep link handling:
  - Deep links in format `zottie://join/{code}` route to this screen
  - Stores pending invite code to AsyncStorage when user is not authenticated
- Updated `app/index.tsx` to check for pending invite codes after authentication:
  - If a pending invite exists, redirects to `/join/{code}` after sign-in
  - Clears the pending invite from storage after use
- Added `@react-native-async-storage/async-storage` dependency
- Updated root `_layout.tsx` to include join route in Stack navigation

### Generate household invite link

- Created `household_invites` database table with Drizzle schema:
  - `id` (text, primary key)
  - `household_id` (text, foreign key)
  - `code` (text, unique - 8 character alphanumeric code)
  - `created_by` (text, user_id)
  - `expires_at` (timestamp - 7 days from creation)
  - `created_at` (timestamp)
- Generated migration `0001_solid_raza.sql` for the new table
- Created `POST /api/household/invite` endpoint:
  - Generates a new 8-character alphanumeric invite code
  - Automatically deletes any existing unexpired invites for the household (invalidates previous)
  - Returns the invite with code, expiration date, etc.
- Created `GET /api/household/invite/:code` endpoint:
  - Validates the invite code and checks expiration
  - Returns household name and invite info if valid
  - Returns 404 if expired or not found
- Added `HouseholdInvite` types to API and mobile app
- Created `createHouseholdInvite` API function in mobile app
- Created `useCreateHouseholdInvite` React Query hook
- Updated `SettingsScreen.tsx` to add "Invite to Household" button:
  - Uses person-add-outline Ionicons icon
  - Generates invite via API when tapped
  - Opens native share sheet with invite link and message
  - Link format: `zottie://join/{code}`
  - Message includes household name and expiration date
- Added 6 new e2e tests for invite creation and validation

### Create a household

- Created `households` and `household_members` database tables with Drizzle schema
- Generated migration `0003_good_wild_child.sql` for new tables and `household_id` column on `pantry_items`
- Created `GET /api/household` endpoint that gets or creates a household for the current user
  - If user has no household, creates one with default name "My Household"
  - Returns household info and list of members
- Created `PATCH /api/household` endpoint to update household name
- Updated all pantry endpoints to use `householdId` instead of `userId` for scoping:
  - `pantryItemList`: filters by household
  - `pantryItemCreate`: assigns new items to user's household
  - `pantryItemUpdate`: verifies item belongs to user's household
  - `pantryItemDelete`: verifies item belongs to user's household
- Added helper function `getOrCreateHouseholdId()` in `db/helpers.ts`
- Created mobile `features/household/` module with:
  - Types (`Household`, `HouseholdMember`, API request/response types)
  - API functions (`getHousehold`, `updateHousehold`)
  - React Query hooks (`useHousehold`, `useUpdateHousehold`)
- Added `household` query key to `lib/query/keys.ts`
- Updated `SettingsScreen.tsx` to display and edit household name:
  - Shows household name with "Tap to edit" hint
  - Tapping reveals inline text input with Save/Cancel buttons
  - Saves update via `useUpdateHousehold` mutation
- Updated `PantryItem` type to include `householdId` field

### Log out from settings page

- Updated `SettingsScreen.tsx` to include a "Log Out" button in the footer
- Button uses a red outline style to indicate destructive action
- Tapping the button shows a confirmation dialog with "Cancel" and "Log Out" options
- On confirmation, clears the React Query cache and calls `signOut()` from Auth0
- The authenticated layout automatically redirects to the landing page when auth state changes
- Added account section at top of settings page showing user's email
- Added "Household settings coming soon" placeholder text

### Settings page accessible from pantry screen

- Created `features/settings/` module with `SettingsScreen.tsx`
- Added settings route at `app/(authenticated)/pantry/settings.tsx`
- Added gear icon (`settings-outline` from Ionicons) to pantry screen header
- Tapping the gear navigates to the settings page via expo-router
- Settings page currently shows placeholder content for future household/account features

### Pull to refresh pantry screen

- Feature was already implemented
- `PantryListScreen.tsx` uses `RefreshControl` from react-native wrapped around the `ScrollView`
- `usePantryItems` hook exposes `isRefreshing` state and `refetch` function
- Pulling down on the pantry list triggers a data refresh from the backend

### Record purchase date

- Added `purchased_at` column to the database schema (nullable timestamp)
- Generated Drizzle migration `0002_daffy_liz_osborn.sql`
- Updated backend API types to include `purchasedAt` in `PantryItem` response
- Modified `pantryItemUpdate` endpoint to set `purchasedAt` when status changes to 'in_stock'
- Updated `pantryItemList` and `pantryItemCreate` endpoints to return `purchasedAt`
- Updated frontend types to include `purchasedAt: number | null` in PantryItem and ShoppingItem
- Added "Last Purchased" row in PantryItemDetailScreen Details section (only shown when date exists)
- Navigation from both pantry and shopping screens now passes `purchasedAt` param
- Purchase date is recorded automatically when items are marked as purchased (either individually or in batch)

### Delete planned item

- Feature was already implemented as part of the item detail page
- Delete button visible at the bottom of `PantryItemDetailScreen.tsx`
- Confirmation dialog shows before deleting with Cancel/Delete options
- Works for both planned items and staples
- Backend DELETE endpoint at `/api/pantry-items/:id` with tests
- Uses `useDeletePantryItem()` hook with React Query cache invalidation

### Edit pantry item name

- Updated backend API (`PantryItemUpdate` type) to accept optional `name` field alongside `status`
- Modified `pantryItemUpdate.ts` endpoint to conditionally update name when provided
- Updated frontend types (`UpdatePantryItemRequest`) to support optional `name` and `status` fields
- Modified `useUpdatePantryItem` hook to accept `name` parameter
- Added edit mode UI in `PantryItemDetailScreen.tsx`:
  - Tapping the item name reveals a text input with Save/Cancel buttons
  - Name updates are persisted to the backend via the mutation
  - UI reflects the current name after successful save
- Added 2 new e2e tests for name-only and name+status updates

### Shopping tab empty state

- Empty state was already implemented as part of the "Add planned item from shopping tab" feature
- When shopping list is empty, displays "You're all set!" message with helpful subtext
- Add planned item input remains visible above the empty state message

### Planned item lifecycle and removal

- Modified `handleStatusChange` in `PantryItemDetailScreen.tsx` to detect when a planned item is being set to "out of stock"
- When a planned item is set to out_of_stock, a confirmation dialog appears asking if the user wants to remove it from their pantry
- Upon confirmation, the item is permanently deleted using the existing `deleteMutation`
- If cancelled, the status change is aborted (item remains in current state)
- Staples continue to work as before: they can cycle through statuses and return to shopping list when out of stock
- This implements the planned item lifecycle: Planned → In Stock → Running Low → Out of Stock (removed)

### Purchased planned items display in pantry list

- Changed filtering logic in `usePantryItems` hook to separate items by purchase status, not just item type
- Collapsible "Planned Items" section now only shows items with `status === 'planned'` (not yet purchased)
- Main pantry list now shows all staple items plus any planned items that have been purchased (`status !== 'planned'`)
- Renamed `stapleItems` to `mainListItems` for clarity since it now contains both staples and purchased planned items
- This allows users to see their purchased planned items alongside staples in the main list

### Item detail page accessible from shopping list

- Shopping list items are now tappable via `TouchableOpacity` wrapper
- Tapping an item navigates to the shared pantry item detail page (`/pantry/[id]`)
- Navigation passes all item data including `itemType` for planned vs staple distinction
- From the detail page, users can change status and delete items
- Same detail screen is used whether navigating from pantry or shopping list

### Pantry screen shows planned items in a collapsible section

- Separated pantry items into two groups: planned items (`itemType === 'planned'`) and staple items (`itemType === 'staple'`)
- Added collapsible "Planned Items" section at the top of the pantry screen
- Section shows item count badge and is collapsed by default
- Tapping the header expands/collapses to show/hide planned items
- Uses purple color scheme (#9B59B6) consistent with planned items elsewhere
- Staple items display below the planned section in the main list
- Also passes `itemType` when navigating to item detail for future features

### Add planned item from shopping tab

- Added `item_type` column to database schema ('staple' | 'planned')
- Added 'planned' as a new status for items not yet purchased for the first time
- Updated backend API to accept and return `itemType` on pantry items
- Created `createPlannedItem` API function that creates items with status 'planned' and itemType 'planned'
- Added text input at top of shopping list for adding planned items
- Planned items appear on shopping list immediately after creation
- Shopping list now filters for 'planned' status items in addition to 'running_low' and 'out_of_stock'
- Purple color scheme (#9B59B6) used for planned items to distinguish them visually

### Reset shopping list checkmarks

- Added "Reset checkmarks" button that appears when items are checked off
- Button displays below the "Mark as Purchased" button as a secondary action
- Shows confirmation dialog before resetting to prevent accidental resets
- On confirmation: clears all checked items from storage and updates UI
- Uses refresh icon and subtle styling to differentiate from the primary purchase action

### Mark checked items as purchased

- Added `markItemsAsPurchased` API function that batch updates item statuses to 'in_stock'
- Added "Mark as Purchased" button that appears when items are checked off
- Button shows count of checked items and uses a shopping cart icon
- On purchase: items are updated to 'in_stock', checked items are cleared, list refreshes
- Items that are now 'in_stock' disappear from the shopping list automatically

---

## Household Feature - Architectural Recommendations

This section outlines the recommended architecture for implementing the multiplayer household feature.

### Database Schema Changes

**New tables:**

1. `households` table:
   - `id` (text, primary key)
   - `name` (text, not null)
   - `created_at` (integer, timestamp)
   - `updated_at` (integer, timestamp)

2. `household_members` table:
   - `id` (text, primary key)
   - `household_id` (text, foreign key to households)
   - `user_id` (text, not null, unique - user can only be in one household)
   - `joined_at` (integer, timestamp)

3. `household_invites` table:
   - `id` (text, primary key)
   - `household_id` (text, foreign key to households)
   - `code` (text, unique - the shareable code/token)
   - `created_by` (text, user_id who created the invite)
   - `expires_at` (integer, timestamp - 7 days from creation)
   - `created_at` (integer, timestamp)

**Modified tables:**

1. `pantry_items` table:
   - Change `user_id` column to `household_id`
   - Add migration to create households for existing users and reassign their items

### API Endpoints

**New endpoints:**

- `GET /household` - Get current user's household info and members
- `PATCH /household` - Update household name
- `POST /household/invite` - Generate new invite link (invalidates previous)
- `GET /household/invite/:code` - Validate invite code and get household info
- `POST /household/join/:code` - Join household via invite code
- `POST /household/leave` - Leave current household

**Modified endpoints:**

- All pantry endpoints should scope queries by `household_id` instead of `user_id`
- Shopping list endpoints should scope by `household_id`

### Migration Strategy

1. Create new tables (households, household_members, household_invites)
2. For each existing user with pantry items:
   - Create a household with default name
   - Add user as member of that household
   - Update their pantry_items to reference the new household_id
3. Drop or keep user_id column on pantry_items (keeping may help audit trail)

### Mobile App Changes

- Add profile/settings screen accessible from tab bar or header
- Profile screen shows: household name (editable), member list, invite button, leave button
- Deep link handling for invite URLs (e.g., `zottie://join/:code`)
- Share sheet integration for invite links

## 2026-01-11

### Landing Page - COMPLETED

**Implementation:**

- Created a landing page for unauthenticated users at the app root (`apps/mobile/app/index.tsx`)
- Added branding with the "zottie" logo and tagline
- Implemented two CTA buttons:
  - "Sign Up" (primary button - blue background)
  - "Sign In" (secondary button - outlined style)
- Used React Native's built-in components (View, Text, TouchableOpacity, StyleSheet)
- Buttons currently log to console as Auth0 integration is not yet implemented

**Technical Details:**

- Followed feature-based organization as specified in project guidelines
- Used inline StyleSheet for component styling
- Responsive layout with flexbox
- Clean, professional design with blue (#3498DB) as primary color

---

### Sign Up & Sign In with Auth0 - COMPLETED

**Implementation:**

- Integrated Auth0 authentication using the `react-native-auth0` package
- Both sign-up and sign-in use Auth0's Universal Login flow (same implementation, Auth0 handles UI differences)
- Created comprehensive auth feature module at `apps/mobile/features/auth/`
- Implemented secure token storage using `expo-secure-store`
- Added authentication state management with React Context
- Created protected routes that require authentication

**Auth Feature Module Structure:**

- `types.ts` - TypeScript interfaces for auth state, user, tokens, and context
- `tokenStorage.ts` - Secure storage wrapper for tokens and user data
- `authService.ts` - Auth0 SDK wrapper handling authorize, logout, session restoration, and token refresh
- `AuthContext.tsx` - React Context definition
- `AuthProvider.tsx` - Context provider with state management and auth methods
- `useAuth.ts` - Custom hook for accessing auth context
- `index.ts` - Public exports

**Configuration:**

- Added environment variable support with separate `.env.development` and `.env.production` files
- Updated `app.config.js` to load Auth0 credentials from environment variables
- Added `.env` files to `.gitignore` for security
- Supports dev/prod builds with different Auth0 applications and bundle IDs

**Key Features:**

- Sign up via Auth0 Universal Login
- Sign in via Auth0 Universal Login
- Secure token storage (iOS Keychain, Android Keystore)
- Session persistence across app restarts
- Automatic session restoration on app launch
- Protected routes with authentication guards
- Sign out functionality
- Loading states during authentication flows

**Files Created:**

- `apps/mobile/features/auth/*` (8 files)
- `apps/mobile/app/(authenticated)/_layout.tsx` - Protected route wrapper
- `apps/mobile/app/(authenticated)/home.tsx` - Home route for authenticated users
- `apps/mobile/features/home/HomeScreen.tsx` - Home screen component
- `apps/mobile/.env.development` - Dev environment variables (needs Auth0 credentials)
- `apps/mobile/.env.production` - Prod environment variables (needs Auth0 credentials)

**Files Modified:**

- `apps/mobile/app/_layout.tsx` - Wrapped with AuthProvider
- `apps/mobile/app/index.tsx` - Added auth redirect logic
- `apps/mobile/features/landing/LandingScreen.tsx` - Wired auth hooks to buttons
- `apps/mobile/app.config.js` - Added dotenv import and Auth0 config
- `apps/mobile/.gitignore` - Added .env files

**Authentication Flow:**

1. User taps "Sign Up" or "Sign In" on landing screen
2. Auth0 Universal Login opens in browser
3. User completes authentication
4. App receives callback with credentials
5. Tokens stored securely in device keychain/keystore
6. User data fetched from Auth0 userInfo endpoint
7. Auth state updated, user redirected to home screen
8. On app restart, session automatically restored from secure storage

**Auth0 Dashboard Configuration Required:**
For both dev and prod applications in Auth0:

- **Application Type:** Native
- **Grant Types:** Authorization Code, Refresh Token
- **Allowed Callback URLs:**
  - Dev: `com.chestercarmer.zottie.dev://auth0/callback`
  - Prod: `com.chestercarmer.zottie://auth0/callback`
- **Allowed Logout URLs:**
  - Dev: `com.chestercarmer.zottie.dev://auth0/logout`
  - Prod: `com.chestercarmer.zottie://auth0/logout`

---

### Drizzle ORM Setup for API - COMPLETED

**Implementation:**

- Integrated Drizzle ORM with Cloudflare D1 for database operations
- Created the `pantry_items` table schema with all required fields
- Set up migration workflow using drizzle-kit

**Database Schema (`apps/api/src/db/schema.ts`):**

- `pantry_items` table with columns:
  - `id` - TEXT (primary key, UUID)
  - `user_id` - TEXT (not null, Auth0 user sub)
  - `name` - TEXT (not null)
  - `status` - TEXT (enum: 'in_stock', 'running_low', 'out_of_stock', default: 'in_stock')
  - `created_at` - INTEGER (timestamp)
  - `updated_at` - INTEGER (timestamp)
- Exported TypeScript types: `PantryItem`, `NewPantryItem`, `PantryItemStatus`

**Files Created:**

- `apps/api/src/db/schema.ts` - Drizzle table schema definition
- `apps/api/src/db/index.ts` - Database helper with `getDb()` function for D1
- `apps/api/drizzle.config.ts` - Drizzle Kit configuration for migrations
- `apps/api/drizzle/0000_small_silhouette.sql` - Initial migration file

**Files Modified:**

- `apps/api/package.json` - Added drizzle-orm, drizzle-kit dependencies and scripts
- `apps/api/wrangler.jsonc` - Added `migrations_dir` pointing to drizzle folder

**New Scripts:**

- `pnpm run db:generate` - Generate new migrations from schema changes
- `pnpm run db:migrate` - Apply migrations to local D1 database
- `pnpm run db:migrate:prod` - Apply migrations to remote/production D1

---

### POST /api/pantry-items Endpoint - COMPLETED

**Implementation:**

- Created the POST `/api/pantry-items` endpoint for creating new pantry items
- Added Zod validation schemas for request/response
- Integrated with Drizzle ORM to insert items into the D1 database
- Added e2e test coverage with 5 passing tests

**Endpoint Specification:**

- **Method:** POST
- **Path:** `/api/pantry-items`
- **Request Body:**
  - `name` - string (required)
  - `status` - enum: 'in_stock' | 'running_low' | 'out_of_stock' (optional, defaults to 'in_stock')
- **Authentication:** Requires `X-User-Id` header (temporary - to be replaced with JWT validation)

---

### View All Staple Pantry Items - COMPLETED

**Implementation:**

- Created GET `/api/pantry-items` endpoint for listing all pantry items for a user
- Added `listPantryItems` function to mobile API layer
- Created `PantryListScreen` component with pull-to-refresh and empty state
- Integrated pantry list into authenticated routes
- Updated home screen to navigate to pantry list

**Mobile Features:**

- Display list of pantry items with status badges (color-coded)
- Pull-to-refresh functionality
- Empty state with helpful message and quick-add button
- Floating action button (FAB) for adding new items
- Loading and error states with retry functionality

---

### View a Staple Pantry Item - COMPLETED

**Implementation:**

- Created pantry item detail screen with comprehensive information display
- Added dynamic route for individual pantry items
- Made list items tappable with navigation to detail view
- Automatic back navigation provided by Expo Router

**Mobile Features:**

- Detail view displays item name, status, and timestamps
- Color-coded status badge matching list view design
- Clean, formatted display of created/updated dates
- Responsive layout with proper spacing and typography
- Back button automatically provided by navigation stack

---

### Update a Staple Pantry Item - COMPLETED

**Implementation:**

- Created PATCH `/api/pantry-items/:id` endpoint for updating pantry item status
- Added status change UI to pantry item detail screen
- Integrated update functionality with Auth0 authentication
- Added comprehensive test coverage for the update endpoint

**Mobile Features:**

- Status change section with three button options (In Stock, Running Low, Out of Stock)
- Current status button is highlighted with active state
- Loading indicator during update operation
- Success/error alerts for user feedback
- Real-time status badge update after successful change
- Disabled state for current status button

---

### Delete a Staple Pantry Item - COMPLETED

**Implementation:**

- Created DELETE `/api/pantry-items/:id` endpoint for deleting pantry items
- Added delete button with confirmation dialog to pantry item detail screen
- Integrated delete functionality with Auth0 authentication
- Added comprehensive test coverage for the delete endpoint

**Mobile Features:**

- Red "Delete Item" button at bottom of detail screen
- Confirmation dialog with item name before deletion
- Loading indicator during delete operation
- Automatic navigation back to list after successful deletion
- Error alerts for failed deletions

---

### Bottom Tab Navigation (Pantry & Shopping Tabs) - COMPLETED

**Implementation:**

- Added bottom tab bar navigation using expo-router's Tabs component
- Created two main tabs: Pantry (default) and Shopping
- Each tab has its own Stack navigator for nested screen navigation
- Home screen hidden from tabs (PRD specified no need for home screen)
- Pantry tab is now the default destination after login

**Navigation Architecture:**

- `(authenticated)/_layout.tsx` - Main Tabs navigator with Pantry and Shopping tabs
- `(authenticated)/pantry/_layout.tsx` - Stack navigator for pantry screens
- `(authenticated)/shopping/_layout.tsx` - Stack navigator for shopping screens
- Tab icons using Ionicons (home-outline for Pantry, cart-outline for Shopping)

---

### Shopping Tab Displays Items to Purchase - COMPLETED

**Implementation:**

- Updated ShoppingListScreen to fetch and display pantry items that need purchasing
- Items with status 'running_low' or 'out_of_stock' appear in the shopping list
- Each item displays its name, status badge (color-coded), and item type (Staple/Planned)
- Items are tappable to navigate to the pantry item detail page
- Pull-to-refresh functionality for updating the list
- Empty state with "You're all set!" message when no items need purchasing

**Data Flow:**

1. ShoppingListScreen fetches all pantry items via existing API
2. Client-side filtering for items with status 'running_low' or 'out_of_stock'
3. Items are tagged as 'staple' type (prepared for future 'planned' items)
4. Tapping an item navigates to the pantry detail page for editing

---

### Check Off Items While Shopping - COMPLETED

**Implementation:**

- Added checkbox UI to shopping list items using Ionicons
- Created persistent storage for checked items using expo-secure-store
- Checkmarks persist across app sessions (navigating away, closing app)
- Checked items display with strikethrough text styling

**Files Created:**

- `apps/mobile/features/shopping/checkedItemsStorage.ts` - Storage utility for checked item IDs

**Mobile Features:**

- Checkbox displayed for each shopping list item
- Tap checkbox to toggle checked/unchecked state
- Checked items show green checkbox icon, strikethrough item name, grayed out text
- Checkmarks persist across tab navigation, app restarts, pull-to-refresh operations
- Item details remain tappable to navigate to detail page
