# zottie Development Progress

See `.ralph/history/completed-progress.md` for completed features.

## Current Next Steps

- Implement "Leave a household" (next household feature)
- Implement "Filter pantry items by search term"
- Implement "Users should be able to log out from the onboarding screen"

## Recently Completed

### Settings page displays household info and members

**Backend (API) changes:**
- Added `users` table to database schema in `apps/api/src/db/schema.ts`:
  - Stores user id, email, name, and timestamps
  - Generated migration file `0002_complex_kabuki.sql`
- Updated auth middleware in `apps/api/src/middleware/auth.ts`:
  - Extracts `email` and `name` from JWT payload
  - Makes them available in request context
- Created `upsertUser` helper function in `apps/api/src/db/helpers.ts`:
  - Inserts or updates user records when they make authenticated requests
- Updated household endpoints to include user info:
  - `householdGet.ts`: Joins with users table, returns email/name with members
  - `householdMembershipGet.ts`: Same join and upsert behavior
  - `householdCreate.ts`: Upserts creator's user info, returns members with email/name
  - `householdJoin.ts`: Upserts joining user's info, returns members with email/name
- Updated API types in `apps/api/src/types.ts`:
  - Added `email` and `name` fields to `HouseholdMember` schema

**Frontend (Mobile) changes:**
- Updated `HouseholdMember` interface in `apps/mobile/features/household/types.ts`:
  - Added `email: string` and `name?: string` fields
- Enhanced `SettingsScreen` in `apps/mobile/features/settings/SettingsScreen.tsx`:
  - Now displays list of household members below the invite button
  - Shows member name (if available) or email
  - Indicates current user with "You" label
  - Styled with person icons and clean list layout

**Testing:**
- Updated test utilities to include email in JWT tokens
- Fixed all test interfaces to expect email/name in member objects
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
