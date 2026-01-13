# zottie Development Progress

See `.ralph/history/completed-progress.md` for completed features.

## Current Next Steps

- Implement "Visual indicator distinguishes planned items from staples"
- Implement "Swipe actions for quick status changes on pantry items"

## Recently Completed

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
