# zottie Development Progress

## 2026-01-14: New onboarding shopping list input screen

Implemented the second screen of the new conversational onboarding flow that asks users what they need from the store.

### What was built

- Created `NewShoppingListInputScreen` component with empathetic, encouraging copy
- Text input allows users to list shopping items naturally
- Clearly visible "Skip" button for users who want to skip this step
- "Continue" button to proceed (disabled when input is empty)
- Responsive layout with keyboard avoidance for iOS
- Updated `ConversationalOnboarding` orchestrator to manage flow between pantry and shopping screens

### User experience

1. After completing or skipping the pantry input screen, user sees "What do you need from the store?"
2. Subtitle encourages: "List anything you want to pick up on your next shopping trip. You can always add more or make changes later."
3. Large multiline text input for listing items (e.g., "bananas, chicken, olive oil...")
4. Helper text: "List as many items as you need, or skip if you're all set for now."
5. Skip button allows proceeding with no shopping list
6. Continue button proceeds to final destination (only enabled when text is entered)

### Design decisions

- Mirrored the design and UX patterns of the pantry input screen for consistency
- Used shopping cart icon instead of basket to differentiate the screens
- Empathetic copy reduces pressure: "You can always add more or make changes later", "skip if you're all set for now"
- Large input area (140px min height) encourages users to list multiple items
- Placeholder shows example format to guide user input
- Auto-focus on input for immediate typing
- Skip button is prominently displayed, not hidden or secondary

### Technical implementation

- Component accepts `onSubmit` and `onSkip` callbacks
- `onSubmit` receives trimmed text when user taps Continue
- Uses `KeyboardAvoidingView` for iOS keyboard handling
- Safe area insets for proper footer positioning on devices with notch/home indicator
- Continue button disabled when input is empty (trimmed)
- Updated `ConversationalOnboarding.tsx` to manage step state (`pantry` | `shopping`)
- State management tracks pantry input for future API integration
- Navigation flows: pantry → shopping → pantry screen

### Flow behavior

The conversational onboarding now flows:
1. Auto-create household with "My Household"
2. Show pantry input screen
3. Show shopping list input screen
4. Navigate to pantry screen

Both pantry and shopping screens can be skipped independently.

### Files changed

- `apps/mobile/features/onboarding/NewShoppingListInputScreen.tsx`: New screen component
- `apps/mobile/features/onboarding/index.ts`: Export new screen
- `apps/mobile/features/onboarding/ConversationalOnboarding.tsx`: Updated orchestration to manage two-screen flow

### Next steps

According to the PRD sequence, the remaining screens to implement are:
1. Processing screen (waits for both pantry and shopping API parsing to complete)
2. Household invitation screen (optional step to invite household partner)

The PRD also specifies that when users submit text, the parsing API should be called in the background and the promise stored for later. This will be implemented when the processing screen is built.

### Testing

All TypeScript type checks and linting passed successfully.

## 2026-01-14: New onboarding flow orchestration

Implemented the orchestration layer that determines which onboarding experience to show users based on a feature flag, enabling toggling between the original and new conversational onboarding flows.

### What was built

- Created onboarding flag API client (`api.ts`, `types.ts`)
- Added `useOnboardingFlag` React Query hook to fetch the flag
- Updated query keys to include `onboardingFlag`
- Completely rewrote `app/onboarding.tsx` to orchestrate both flows
- Implemented auto-household creation for conversational flow
- Added loading states for flag fetching and household creation

### How it works

The onboarding route now:
1. Fetches the onboarding flag from `/api/onboarding/flag` endpoint
2. Shows a loading screen while fetching the flag
3. Routes to the appropriate onboarding experience:
   - **Conversational flow**: Auto-creates household with name "My Household", then shows `NewPantryInputScreen`
   - **Original flow**: Shows `CreateHouseholdScreen` → `QuickAddInventoryScreen`

### Conversational flow behavior

When the flag returns 'conversational':
1. Household is automatically created with default name "My Household" (no user input needed)
2. Loading screen shows while household is being created
3. Once household exists, user sees the pantry input screen
4. When user completes or skips, they're taken to their pantry

The conversational flow currently only has the pantry input screen implemented. As additional screens are built (shopping input, processing, invitation), they'll be added to the orchestration sequence.

### Original flow behavior

The original flow remains unchanged:
1. User manually creates household on `CreateHouseholdScreen`
2. User can select curated items on `QuickAddInventoryScreen`
3. User navigates to pantry

### Technical implementation

- `apps/mobile/features/onboarding/api.ts`: API client for flag endpoint
- `apps/mobile/features/onboarding/types.ts`: TypeScript types (`OnboardingFlagType`, `OnboardingFlagResponse`)
- `apps/mobile/features/onboarding/hooks/useOnboardingFlag.ts`: React Query hook with infinite stale time
- `apps/mobile/lib/query/keys.ts`: Added `onboardingFlag` query key
- `apps/mobile/app/onboarding.tsx`: Complete rewrite to orchestrate both flows
  - Uses `useOnboardingFlag` to fetch flag
  - Uses `useCreateHousehold` for auto-creation in conversational flow
  - Manages loading and error states
  - Conditionally renders screens based on flag value

### Testing

All TypeScript type checks and linting passed successfully.

### User experience

- Users see a consistent loading experience while the app determines which onboarding to show
- The toggle between experiences is completely transparent to the user
- No code changes required in mobile app to switch between flows (just update backend flag file and deploy)

### What's next

The remaining conversational onboarding screens can now be built and added to the orchestration:
- Shopping list input screen
- Processing screen (waits for both API calls)
- Household invitation screen

Each screen will be added to the sequence in `app/onboarding.tsx` as it's implemented.

### Files changed

- `apps/mobile/features/onboarding/api.ts`: New API client
- `apps/mobile/features/onboarding/types.ts`: New types file
- `apps/mobile/features/onboarding/hooks/useOnboardingFlag.ts`: New hook
- `apps/mobile/features/onboarding/hooks/index.ts`: Export hook
- `apps/mobile/features/onboarding/index.ts`: Export hook from feature
- `apps/mobile/lib/query/keys.ts`: Added onboardingFlag query key
- `apps/mobile/app/onboarding.tsx`: Complete rewrite for orchestration
- `.ralph/prds.json`: Marked "New onboarding flow orchestration" and "New onboarding household creation" as completed

## 2026-01-14: New onboarding pantry input screen

Implemented the first screen of the new conversational onboarding flow that asks users what they have in their pantry.

### What was built

- Created `NewPantryInputScreen` component with empathetic, encouraging copy
- Text input allows users to list pantry items naturally
- Clearly visible "Skip" button for users who want to skip this step
- "Continue" button to proceed (disabled when input is empty)
- Responsive layout with keyboard avoidance for iOS

### User experience

1. User sees a friendly screen asking "What's in your pantry?"
2. Subtitle reassures them: "Just start listing what you have. No need to be perfect - you can easily add more or make changes later."
3. Large multiline text input for listing items (e.g., "milk, eggs, bread, apples...")
4. Helper text reminds users they can list as many items as they'd like, or skip
5. Skip button allows starting with empty pantry
6. Continue button proceeds to next step (only enabled when text is entered)

### Design decisions

- Used multiline text input instead of voice input to give users more control and visibility
- Empathetic copy focuses on reducing anxiety: "No need to be perfect", "you can easily add more or make changes later"
- Large input area (140px min height) encourages users to list multiple items
- Placeholder shows example format to guide user input
- Auto-focus on input for immediate typing
- Skip button is prominently displayed, not hidden or secondary

### Technical implementation

- Component accepts `onSubmit` and `onSkip` callbacks
- `onSubmit` receives trimmed text when user taps Continue
- Uses `KeyboardAvoidingView` for iOS keyboard handling
- Safe area insets for proper footer positioning on devices with notch/home indicator
- Continue button disabled when input is empty (trimmed)
- Follows existing onboarding screen patterns for consistency

### Files changed

- `apps/mobile/features/onboarding/NewPantryInputScreen.tsx`: New screen component
- `apps/mobile/features/onboarding/index.ts`: Export new screen

### Next steps

According to the PRD, this screen should:

1. Trigger parsing API call in background when user submits (not yet implemented)
2. Immediately navigate to next screen (shopping list input) without waiting for response
3. Store the parsing promise so it can be awaited later on the processing screen

The screen is ready for integration into the onboarding flow orchestration.
