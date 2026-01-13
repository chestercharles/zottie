# zottie Development Progress

See `.ralph/history/completed-progress.md` for completed features.

## Current Next Steps

- Implement "Leave a household" (next household feature)
- Implement "Settings page displays household info and members"
- Implement "Filter pantry items by search term"

## Recently Completed

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
