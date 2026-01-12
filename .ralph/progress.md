# zottie Development Progress

See `.ralph/history/completed-progress.md` for completed features.

## Current Next Steps

- Implement "Pantry screen shows planned items in a collapsible section"
- Implement "Item detail page accessible from shopping list"
- Implement "Planned item lifecycle and removal"

## Recently Completed

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
