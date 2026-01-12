# zottie Development Progress

See `.ralph/history/completed-progress.md` for completed features.

## Current Next Steps

- Implement "Record purchase date"

## Recently Completed

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
