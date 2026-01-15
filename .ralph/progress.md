# zottie Development Progress

## 2026-01-14: Commands feedback empathetic UI presentation

Replaced the harsh danger box styling for command feedback with a warm, conversational design that feels like guidance rather than an error.

### What was built

- Replaced red/danger error container with neutral, warm feedback styling
- Added conversational chat bubble icon to make feedback feel like a helpful response
- Updated colors from harsh red (#FADBD8, #C0392B) to soft gray (#F5F6F7, #5D6D7E)
- Changed layout to horizontal with icon + text for a message-like appearance

### User experience

When the system doesn't understand a command, users now see:
1. A soft gray card (not red/danger styling)
2. A chat bubble icon that signals "here's a response" rather than "error"
3. The message text in a readable, non-alarming gray color
4. Layout feels like part of a conversation, not a failure state

### Design decisions

**Conversational design:**
- Used `chatbubble-ellipses-outline` icon to reinforce that this is the system talking back
- Horizontal layout (icon + text) mimics a chat message pattern
- Rounded corners (12px) feel modern and friendly

**Warm, neutral colors:**
- Background: `#F5F6F7` - light gray, feels informational not alarming
- Text/Icon: `#5D6D7E` - readable gray that's calm and neutral
- Removed all red/danger coloring that implied user made a mistake

**Readable text:**
- Increased font size from 14px to 15px for better readability
- Added line height (22px) for comfortable reading
- Left-aligned text (with icon) instead of centered for natural reading flow

### Technical implementation

**CommandsScreen.tsx changes:**
- Renamed `errorContainer` → `feedbackContainer`
- Renamed `errorText` → `feedbackText`
- Added `feedbackIcon` style for the chat bubble icon
- Added Ionicons `chatbubble-ellipses-outline` icon
- Updated both feedback displays (main screen and confirmation screen)

**Styling:**
```typescript
feedbackContainer: {
  backgroundColor: '#F5F6F7',  // Soft gray, not red
  padding: 16,
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'flex-start',
}
feedbackText: {
  color: '#5D6D7E',  // Calm gray, not danger red
  fontSize: 15,
  lineHeight: 22,
}
```

### Files changed

- `apps/mobile/features/commands/CommandsScreen.tsx`: Updated feedback UI styling

### Benefits

1. **Supportive, not patronizing**: Feedback feels like helpful guidance
2. **Reduced anxiety**: No red colors that imply user error
3. **Conversational flow**: Message bubble design feels like part of a dialogue
4. **Consistent with UX principles**: Aligns with zottie's empathetic, user-first approach
5. **Better readability**: Improved typography for longer feedback messages

### Testing

All TypeScript type checks and linting passed successfully.

## 2026-01-14: Update shopping list onboarding screen to use voice input

Updated the shopping list onboarding screen to use the VoiceInput component, providing a consistent voice-first experience across both onboarding input screens.

### What was built

- Updated `NewShoppingListInputScreen` to use VoiceInput component instead of TextInput
- Replaced manual text input with voice recording functionality
- Updated hint text to guide users toward voice input
- Removed keyboard-related components (KeyboardAvoidingView, Platform imports)
- Maintained the same user flow and navigation patterns

### User experience

1. User sees the shopping screen with cart icon and empathetic copy
2. Instead of a text input field, they see an animated microphone button
3. Hint text now reads: "Tap the microphone and list what you need from the store, or skip if you're all set for now."
4. User taps the mic button to start recording
5. VoiceInput provides visual feedback (color changes, pulsing animation) while recording
6. User taps again to stop recording
7. VoiceInput processes the audio and returns transcript
8. Continue button becomes enabled after transcript is received
9. User can tap Continue to proceed or Skip to bypass

### Design decisions

**Voice-first experience:**
- Consistent with pantry screen - both now use voice input
- Reduces friction by eliminating typing on mobile keyboards
- More natural for users to speak their shopping list items
- Maintains empathetic, supportive tone throughout

**Consistent interaction patterns:**
- Uses the same VoiceInput component as pantry screen and CommandsScreen
- Familiar button size (140px) and animations across the app
- Same spring physics and haptic feedback
- Status text provides clear guidance at each step

**Cohesive onboarding flow:**
- Both onboarding input screens now have identical interaction patterns
- Users learn voice input once on the pantry screen, then reuse the skill
- Reduces cognitive load and creates a unified onboarding experience

### Technical implementation

**NewShoppingListInputScreen.tsx changes:**
- Removed `TextInput`, `KeyboardAvoidingView`, and `Platform` imports
- Added `VoiceInput` component import
- Changed state from `text` to `transcript`
- Added `handleTranscriptReceived` callback
- Replaced `KeyboardAvoidingView` wrapper with plain `View`
- Replaced TextInput with VoiceInput inside centered container
- Updated button enablement to check `transcript.trim()` instead of `text.trim()`
- Removed `input` style object, added `voiceInputContainer` style

**VoiceInput configuration:**
- Button size: 140px (matches pantry screen)
- Status text: "Tap to speak", "Tap to stop", "Processing..."
- Uses default colors (blue idle, red recording, orange processing)
- No external processing state control needed

### Files changed

- `apps/mobile/features/onboarding/NewShoppingListInputScreen.tsx`: Updated to use VoiceInput

### Benefits

1. **Consistent UX**: Both onboarding screens now use identical voice input patterns
2. **More natural input**: Speaking is faster and easier than typing on mobile
3. **Reduced friction**: No keyboard, autocorrect, or typing errors
4. **Simpler code**: Removed keyboard handling complexity
5. **Empathetic UX**: Voice feels more conversational and supportive
6. **Cohesive onboarding**: Users have a unified voice-first experience throughout setup

### Testing

All TypeScript type checks and linting passed successfully.

## 2026-01-14: Update pantry onboarding screen to use voice input

Replaced the text input in the pantry onboarding screen with the VoiceInput component, creating a more natural and seamless onboarding experience that allows users to speak instead of type.

### What was built

- Updated `NewPantryInputScreen` to use VoiceInput component instead of TextInput
- Replaced manual text input with voice recording functionality
- Updated help text to guide users toward voice input
- Removed keyboard-related components (no longer needed)
- Maintained the same user flow and navigation patterns

### User experience

1. User sees the familiar pantry screen with basket icon and empathetic copy
2. Instead of a text input field, they see an animated microphone button
3. Hint text now reads: "Tap the microphone and start listing items you have, or skip if you prefer to add things later."
4. User taps the mic button to start recording
5. VoiceInput provides visual feedback (color changes, pulsing animation) while recording
6. User taps again to stop recording
7. VoiceInput processes the audio and returns transcript
8. Continue button becomes enabled after transcript is received
9. User can tap Continue to proceed or Skip to bypass

### Design decisions

**Voice-first experience:**
- Reduces friction by eliminating typing on mobile keyboards
- More natural for users to speak their grocery items
- Maintains empathetic, supportive tone throughout
- Voice input aligns with conversational onboarding goals

**Consistent interaction patterns:**
- Uses the same VoiceInput component as CommandsScreen
- Familiar button size and animations across the app
- Same spring physics and haptic feedback
- Status text provides clear guidance at each step

**Progressive enablement:**
- Continue button only enabled after receiving transcript
- Users can skip without recording anything
- No forced voice interaction for users who prefer to skip

**Clean, focused layout:**
- Removed keyboard-related complexity (KeyboardAvoidingView, Platform checks)
- Voice input container centered with padding for visual balance
- Help text updated to reflect voice interaction model

### Technical implementation

**NewPantryInputScreen.tsx changes:**
- Removed `TextInput`, `KeyboardAvoidingView`, and Platform imports
- Added `VoiceInput` component import
- Changed state from `text` to `transcript`
- Added `handleTranscriptReceived` callback
- Replaced text input with VoiceInput inside centered container
- Updated button enablement to check `transcript.trim()` instead of `text.trim()`
- Removed all text input styling, added `voiceInputContainer` style

**VoiceInput configuration:**
- Button size: 140px (slightly smaller than default for onboarding context)
- Default status text (Tap to speak, Tap to stop, Processing...)
- Uses default colors (blue idle, red recording, orange processing)
- No external processing state control needed

**Styling changes:**
- Removed: `input` style object (was for TextInput)
- Added: `voiceInputContainer` style with center alignment and vertical padding
- Kept all other styles unchanged (title, subtitle, footer, buttons)

### Files changed

- `apps/mobile/features/onboarding/NewPantryInputScreen.tsx`: Updated to use VoiceInput

### Benefits

1. **More natural input**: Speaking is faster and easier than typing on mobile
2. **Reduced friction**: No keyboard, autocorrect, or typing errors
3. **Consistent patterns**: Same voice experience as CommandsScreen
4. **Simpler code**: Removed keyboard handling complexity
5. **Empathetic UX**: Voice feels more conversational and supportive

### Next steps

The shopping list onboarding screen should be updated with the same pattern (PRD #13).

### Testing

All TypeScript type checks and linting passed successfully.

## 2026-01-14: Abstract voice recording into reusable VoiceInput component

Created a reusable VoiceInput component that encapsulates all voice recording functionality, making it easy to add voice input to any screen in the app. Refactored CommandsScreen to use this new component, significantly reducing code duplication.

### What was built

- Created `VoiceInput` component in `apps/mobile/components/VoiceInput.tsx`
- Extracted all voice recording logic from CommandsScreen
- Component accepts flexible props for customization
- Refactored CommandsScreen to use VoiceInput, reducing complexity significantly

### Component features

The VoiceInput component encapsulates:
1. **expo-speech-recognition integration** with permission handling
2. **Animated mic button** using react-native-reanimated with spring physics
3. **Recording state management** (idle, recording, processing)
4. **Haptic feedback** on interactions
5. **Visual feedback** with color changes based on state
6. **Status text display** that updates based on recording state

### Component API

The component accepts these props:

**Required:**
- `onTranscriptReceived: (transcript: string) => void` - Callback when transcript is received

**Optional customization:**
- `buttonSize?: number` - Size of mic button (default: 160)
- `idleColor?: string` - Button color when idle (default: '#3498DB')
- `recordingColor?: string` - Button color when recording (default: '#E74C3C')
- `processingColor?: string` - Button color when processing (default: '#F39C12')
- `isProcessing?: boolean` - External processing state control
- `showStatusText?: boolean` - Whether to show status text (default: true)
- `statusTextIdle?: string` - Text when idle (default: 'Tap to speak')
- `statusTextRecording?: string` - Text when recording (default: 'Tap to stop')
- `statusTextProcessing?: string` - Text when processing (default: 'Processing...')
- `contextualStrings?: string[]` - Context hints for speech recognition
- `onError?: (error: string) => void` - Error callback

### Design decisions

**Flexible and reusable:**
- Component is highly customizable through props
- Can work in different contexts (commands, onboarding, etc.)
- Handles all voice input complexity internally
- Parent components only need to handle transcript and errors

**Maintains iOS-native feel:**
- Uses spring physics for all animations (withSpring)
- Provides haptic feedback on stop
- Smooth transitions between states
- Polished visual feedback

**State management:**
- Internal recording state (idle, recording, processing)
- External processing state can be controlled via `isProcessing` prop
- Allows parent to show processing state after transcript is received

**Error handling:**
- Optional error callback for parent to handle display
- Handles permission errors gracefully
- Reports speech recognition errors

### CommandsScreen refactoring

The refactored CommandsScreen is now much cleaner:
- Removed ~130 lines of voice recording boilerplate
- Removed all animation code (handled by VoiceInput)
- Removed all speech recognition event handlers
- Removed permission handling code
- Removed haptic feedback code
- Simplified state management (ProcessingState instead of RecordingState)
- Kept only command parsing and execution logic

**Before:** 430 lines with mixed concerns
**After:** ~230 lines focused on command processing

### Usage example

```typescript
<VoiceInput
  onTranscriptReceived={handleTranscript}
  onError={handleError}
  isProcessing={isProcessing}
  statusTextProcessing="Processing command..."
/>
```

### Technical implementation

**VoiceInput.tsx:**
- Uses `react-native-reanimated` for smooth animations
- Spring physics: `damping: 3, stiffness: 100` for recording pulse
- Spring physics: `damping: 15, stiffness: 200` for idle/stop
- Handles all speech recognition events internally
- Manages permission requests automatically
- Provides visual and haptic feedback

**CommandsScreen.tsx:**
- Now uses VoiceInput instead of custom implementation
- Passes transcript to command parsing logic
- Controls processing state during command parsing
- Displays errors and help text around VoiceInput

### Files changed

- `apps/mobile/components/VoiceInput.tsx`: New reusable component
- `apps/mobile/components/index.ts`: Export VoiceInput
- `apps/mobile/features/commands/CommandsScreen.tsx`: Refactored to use VoiceInput

### Benefits

1. **Code reuse**: Voice input can now be easily added to any screen
2. **Maintainability**: Voice logic is in one place, easier to update
3. **Consistency**: All voice inputs will behave the same way
4. **Simplicity**: Parent components are much simpler
5. **Testability**: Voice logic can be tested independently

### Next steps

This component is now ready to be used in the onboarding screens:
1. Update pantry onboarding screen to use VoiceInput (PRD #12)
2. Update shopping list onboarding screen to use VoiceInput (PRD #13)

### Testing

All TypeScript type checks and linting passed successfully.

## 2026-01-14: New onboarding household invitation screen

Implemented the household invitation screen that allows users to invite their household partner after completing the initial setup. This completes the full conversational onboarding flow.

### What was built

- Created `NewHouseholdInvitationScreen` component with empathetic copy explaining the value of inviting someone
- Automatically generates a household invite code when the screen loads
- Displays the invite code in a visually prominent way
- Integrated native Share API to allow users to share the invite link
- Added clearly visible "Skip" button since this step is entirely optional
- Updated `ConversationalOnboarding` orchestrator to include invitation step in the flow

### User experience

1. After items are successfully processed, user sees the invitation screen
2. Screen shows a "people" icon with friendly title "Invite your household"
3. Subtitle explains the value: "Share your grocery lists and coordinate shopping together"
4. While invite code is generating, user sees a loading spinner with "Creating your invite link..."
5. Once generated, invite code is displayed in a prominent card
6. User can tap "Share invite" to open native share sheet with pre-formatted message
7. User can tap "Skip" to proceed to the pantry without inviting anyone
8. After sharing or skipping, user navigates to the pantry screen

### Design decisions

**Empathetic messaging:**
- Title asks a question that feels inviting: "Invite your household"
- Subtitle explains the value proposition without being pushy
- Lists examples: "partner, roommate, or anyone you share a kitchen with"
- Hint text guides the user: "Tap 'Share invite' to send this link"

**Automatic invite generation:**
- Uses existing `useCreateHouseholdInvite` hook from household feature
- Generates invite code automatically on screen load (no user input required)
- Shows loading state while generating
- Handles errors gracefully with alert dialog suggesting they can skip

**Native sharing:**
- Uses React Native's Share API for platform-native experience
- Pre-formats message: "Join my household on zottie! Use this link: zottie://invite/[code]"
- On iOS, this opens the native share sheet
- After sharing, automatically navigates to pantry

**Visual consistency:**
- Follows the same design patterns as pantry and shopping input screens
- Same layout structure, typography, button styles
- Skip button on left, primary action on right
- Safe area insets for proper spacing on all devices

### Technical implementation

**NewHouseholdInvitationScreen.tsx:**
- Accepts `onContinue` and `onSkip` callbacks for navigation
- Uses `useCreateHouseholdInvite` hook to generate invite
- `useEffect` triggers invite creation on mount
- Loading state while invite is pending or code not yet set
- `handleShare` function uses React Native Share API
- Error handling with Alert.alert for failed invite creation

**ConversationalOnboarding.tsx:**
- Added 'invitation' to `OnboardingStep` type union
- Updated processing success path to navigate to 'invitation' instead of pantry
- Updated error "Continue anyway" to navigate to 'invitation' instead of pantry
- Added conditional render for invitation step
- Both "Share invite" and "Skip" navigate to pantry screen

### Flow behavior

The complete conversational onboarding now flows:
1. Auto-create household with "My Household"
2. Show pantry input screen (can skip or enter text)
3. Show shopping list input screen (can skip or enter text)
4. Show processing screen with warm animation
5. Parse and execute both inputs in parallel
6. On success: Show household invitation screen
7. On error: Show retry UI, then invitation screen if user continues anyway
8. Show invitation screen (can share or skip)
9. Navigate to pantry screen

### Files changed

- `apps/mobile/features/onboarding/NewHouseholdInvitationScreen.tsx`: New invitation screen component
- `apps/mobile/features/onboarding/index.ts`: Export new screen
- `apps/mobile/features/onboarding/ConversationalOnboarding.tsx`: Updated orchestration to include invitation step

### Next steps

This completes the core conversational onboarding feature set. The remaining PRDs focus on:
1. Eval system for command parsing
2. Maximizing empathy in command parsing behavior
3. Enhanced animations for command processing
4. Voice input component abstraction and integration

### Testing

All TypeScript type checks and linting passed successfully.

## 2026-01-14: New onboarding processing screen

Implemented the processing screen that handles parsing and executing user input from both pantry and shopping list onboarding screens. This completes the core conversational onboarding flow.

### What was built

- Created `NewProcessingScreen` component with warm, breathing animation using spring physics
- Implemented `useOnboardingItemParsing` hook to parse and execute commands in one operation
- Updated `ConversationalOnboarding` orchestrator to manage the three-step flow
- Added empathetic error handling with specific retry options
- Processing happens immediately after shopping input screen (non-blocking)

### User experience

1. After entering shopping list items, user sees the processing screen
2. Screen shows a gentle pulsing animation (not a harsh spinner) with reassuring copy
3. Behind the scenes, both pantry and shopping text are parsed and executed in parallel
4. If both succeed, user automatically navigates to the pantry screen
5. If either fails, user sees a friendly error message with specific retry options:
   - "Retry pantry items" button (if pantry parsing failed)
   - "Retry shopping items" button (if shopping parsing failed)
   - "Continue anyway" button to skip the error and proceed

### Design decisions

**Loading animation:**
- Used `withSpring` physics for organic, iOS-native feel
- Pulsing/breathing animation on checkmark icon (scale: 1 → 1.15 → 1)
- Gentle opacity fade (0.6 → 1 → 0.6) synchronized with scale
- No harsh spinner that creates anxiety
- Empathetic copy: "Setting up your kitchen...", "This will just take a moment"

**Error handling:**
- Warm, supportive error UI (not red/danger styling)
- Clear explanation of what went wrong
- Specific retry options for each failed step
- "Continue anyway" option so users aren't blocked
- Errors don't lose user's input - retry takes them back to the relevant screen

**API integration:**
- Created contextual commands for better parsing:
  - Pantry: "I have: [user text]"
  - Shopping: "I need to buy: [user text]"
- Parse and execute happen in one operation per context
- Both operations run in parallel using `Promise.allSettled`
- Automatically invalidates pantry items query on success

### Technical implementation

**NewProcessingScreen.tsx:**
- Accepts `step` prop: 'pantry' | 'shopping' | 'both'
- Uses `react-native-reanimated` for smooth animations
- Spring physics: `damping: 8, stiffness: 100`
- Opacity animation: 1200ms duration with ease-in-out easing
- Clean, centered layout with helpful messaging

**useOnboardingItemParsing.ts:**
- Wraps existing `parseCommand` and `executeCommand` API clients
- Adds contextual phrasing to improve parsing accuracy
- Handles auth token and user ID internally
- Invalidates pantry items cache on success
- Returns parse response for potential future use

**ConversationalOnboarding.tsx:**
- Added 'processing' step to onboarding flow
- State now tracks both pantry and shopping text plus any errors
- `useEffect` triggers parsing when entering 'processing' step
- Error state shows empathetic retry UI with specific buttons
- Success automatically navigates to pantry screen

### Flow behavior

The complete conversational onboarding now flows:
1. Auto-create household with "My Household"
2. Show pantry input screen (can skip or enter text)
3. Show shopping list input screen (can skip or enter text)
4. Show processing screen with warm animation
5. Parse and execute both inputs in parallel
6. On success: Navigate to pantry screen
7. On error: Show retry UI with specific options

### Files changed

- `apps/mobile/features/onboarding/NewProcessingScreen.tsx`: New loading screen component
- `apps/mobile/features/onboarding/hooks/useOnboardingItemParsing.ts`: New parsing hook
- `apps/mobile/features/onboarding/hooks/index.ts`: Export new hook
- `apps/mobile/features/onboarding/ConversationalOnboarding.tsx`: Updated orchestration with processing step and error handling
- `apps/mobile/features/onboarding/index.ts`: Export new screen and hooks
- `apps/mobile/app/onboarding.tsx`: Cleanup unused styles

### Next steps

According to the PRD sequence, the remaining screen to implement is:
1. Household invitation screen (optional step to invite household partner after processing completes)

The processing screen is now complete and ready to be followed by the invitation screen.

### Testing

All TypeScript type checks and linting passed successfully.

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
