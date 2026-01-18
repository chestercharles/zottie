# zottie Development Progress

## 2026-01-17: Land users on Shopping tab after onboarding

Implemented the "(Onboarding Epic) Land users on Shopping tab after onboarding" feature.

### Changes

- Modified `apps/mobile/features/onboarding/ConversationalOnboarding.tsx`:
  - Changed `handleShoppingSkip` to navigate to `/(authenticated)/shopping` instead of `/(authenticated)/pantry`
  - Changed successful processing completion to navigate to `/(authenticated)/shopping`
  - Changed "Continue anyway" error recovery button to navigate to `/(authenticated)/shopping`

### How it works

After completing the onboarding voice input flow, users now land on the Shopping tab instead of the Pantry tab. This applies to all three exit paths from onboarding:

1. **Skip**: User skips voice input → lands on Shopping tab
2. **Success**: User speaks items, they're processed successfully → lands on Shopping tab
3. **Error recovery**: User encounters an error and taps "Continue anyway" → lands on Shopping tab

This creates a clear mental model: users just told us what they need from the store, and they immediately see those items on their shopping list where they expect them. The Pantry tab remains accessible via navigation for users who want to explore it.

## 2026-01-17: Lightweight command parse endpoint

Implemented the "Lightweight command parse endpoint" feature.

### Changes

#### Backend API

- Created `apps/api/src/endpoints/commandParse.ts`:
  - New endpoint that takes natural language text and returns structured pantry actions
  - Uses OpenAI's `gpt-4o-mini` model for fast, focused parsing
  - Non-conversational: no history, no streaming, just text-in/actions-out
  - Extracts item names from speech like "cherries, grapes, and some milk"
  - Handles status hints in input:
    - "running low on X" or "almost out of X" → status: `running_low`
    - "out of X" or "need X" → status: `out_of_stock`
    - Default status is `in_stock`
  - Returns actions that can be passed directly to `/api/commands/execute`

- Modified `apps/api/src/index.ts`:
  - Added import of `CommandParseEndpoint`
  - Registered route at `/api/commands/parse`

### How it works

The endpoint accepts a POST request with a `command` string:

```json
{
  "command": "cherries, grapes, and I'm running low on milk"
}
```

And returns structured actions:

```json
{
  "success": true,
  "result": {
    "actions": [
      { "type": "add_to_pantry", "item": "cherries", "status": "in_stock" },
      { "type": "add_to_pantry", "item": "grapes", "status": "in_stock" },
      { "type": "add_to_pantry", "item": "milk", "status": "running_low" }
    ]
  }
}
```

This endpoint powers:
1. The pantry onboarding card (voice input to add items)
2. The future persistent voice-add button on the Pantry screen

It's simpler and faster than the full assistant conversation flow, making it ideal for quick item additions.

## 2026-01-17: Remove Commands tab and related code

Implemented the "Remove Commands tab and related code" feature.

### Changes

#### Mobile App

- Deleted `apps/mobile/app/(authenticated)/commands.tsx`:
  - Removed the Commands route file

- Deleted `apps/mobile/features/commands/` directory:
  - Removed `CommandsScreen.tsx` - the main Commands UI component
  - Removed `api.ts` - API client functions for parse/execute
  - Removed `types.ts` - TypeScript types for commands
  - Removed `hooks/useCommandMutations.ts` - React Query mutation hooks
  - Removed `hooks/index.ts` and `index.ts` - barrel exports

- Modified `apps/mobile/app/(authenticated)/_layout.tsx`:
  - Removed the Commands tab from the Tabs navigator
  - App now has three main tabs: Pantry, Shopping, and Assistant

- Modified `apps/mobile/features/onboarding/api.ts`:
  - Added `parseCommand` and `executeCommand` functions (moved from commands feature)
  - Onboarding now has its own API client for these functions

- Modified `apps/mobile/features/onboarding/types.ts`:
  - Added command-related types needed by onboarding's item parsing

- Modified `apps/mobile/features/onboarding/hooks/useOnboardingItemParsing.ts`:
  - Updated import to use local `../api` instead of `@/features/commands/api`

#### Backend API

- Deleted `apps/api/src/endpoints/commandParse.ts`:
  - Removed the parse endpoint that converted natural language to structured commands

- Deleted `apps/api/src/endpoints/commandParse.eval.ts`:
  - Removed the 70+ test cases for command parsing

- Modified `apps/api/src/index.ts`:
  - Removed import of `CommandParseEndpoint`
  - Removed route registration for `/api/commands/parse`
  - Kept `/api/commands/execute` (used by Assistant feature)

- Modified `apps/api/src/types.ts`:
  - Removed `CommandParseRequest` and `CommandParseResponse` exports
  - Kept `CommandActionType` and `CommandAction` (used by execute endpoint)

### What was preserved

- `/api/commands/execute` endpoint - still used by Assistant feature to execute proposed actions
- `commandExecute.ts` and `commandExecute.test.ts` - the execute endpoint and its tests
- `CommandActionType` and `CommandAction` types - needed by execute endpoint

### How it works

The Commands tab has been fully removed from the app. The Assistant feature now serves as the primary voice/text interface for interacting with zottie. Users can still:
- Add items to their pantry via the Assistant
- Update item statuses via the Assistant
- Manage their shopping list via the Assistant

The onboarding flow continues to work because the `parseCommand` and `executeCommand` functions were moved into the onboarding feature module. This keeps the onboarding's natural language parsing working while removing the Commands feature entirely.

## 2026-01-17: Pantry contextual onboarding card

Implemented the "(Onboarding Epic) Pantry contextual onboarding card" feature.

### Changes

- Created `apps/mobile/features/pantry/PantryOnboardingCard.tsx`:
  - New component that displays an onboarding card pitching the value of filling out the pantry
  - Includes the VoiceInput component for voice-based item entry
  - Uses the existing `useOnboardingItemParsing` hook with `context: 'pantry'` to parse and add items
  - Handles three states: input (default), processing (while adding items), and error (with retry option)
  - Styled as a Card component following the design system

- Modified `apps/mobile/features/pantry/hooks/usePantryItems.ts`:
  - Added `hasInStockItems` computed value that checks if the user has any items with `in_stock` or `running_low` status
  - This value is used to determine when to show/hide the onboarding card

- Modified `apps/mobile/features/pantry/PantryListScreen.tsx`:
  - Imported and integrated the `PantryOnboardingCard` component
  - Updated `renderListHeader` to show the onboarding card when `hasInStockItems` is false and not in search mode
  - The card appears above the planned items section (if any)
  - Removed the EmptyState for no items - the onboarding card now serves this purpose
  - Search mode still shows "No results found" empty state when appropriate

### How it works

The onboarding card appears on the Pantry tab when the user has no in-stock items (items with `in_stock` or `running_low` status). The card:

1. Displays a value proposition: "Tell me what's in your pantry - I can help you figure out what to make for dinner, remind you when you're running low, and keep your shopping list updated automatically."
2. Provides a voice input button (100px, smaller than onboarding) for natural item entry
3. Includes helper text with example input
4. Shows a processing state while items are being added
5. Handles errors gracefully with a retry option

The card persists until the user adds at least one in-stock item - there is no manual dismiss option. If the user has planned items (from the shopping list) but no in-stock items, those planned items remain visible below the onboarding card in the collapsible "Planned Items" section.

This completes the Onboarding Epic by providing a contextual way to set up the pantry after the streamlined shopping-list-only initial onboarding.

## 2026-01-17: Simplify onboarding to shopping list only

Implemented the "(Onboarding Epic) Simplify onboarding to shopping list only" feature.

### Changes

- Modified `apps/mobile/features/onboarding/ConversationalOnboarding.tsx`:
  - Removed the pantry input step - onboarding now starts directly with the shopping list
  - Removed the household invitation step - after processing, users go directly to the app
  - Simplified the `OnboardingStep` type from `'pantry' | 'shopping' | 'processing' | 'invitation'` to just `'shopping' | 'processing'`
  - Removed pantry-related state and handlers
  - Skip button now navigates directly to the app instead of going to processing
  - "Continue anyway" on error now goes directly to the app instead of the invitation step

- Modified `apps/mobile/features/onboarding/NewProcessingScreen.tsx`:
  - Removed the `step` prop since we only process shopping items now
  - Simplified the message to always show "Getting your shopping list ready..."

### How it works

The new onboarding flow is:
1. User is asked "What do you need from the store?"
2. User speaks their shopping list items via voice input (or skips)
3. If items provided, a brief processing screen appears while items are added
4. User lands directly in the app

This gets users to value faster by:
- Eliminating upfront friction of documenting their entire pantry
- Removing the household invitation step (still accessible from settings)
- Focusing on immediate utility (shopping list) rather than setup

The pantry setup will become a separate, contextual experience via an onboarding card (see companion PRD).

## 2026-01-17: Remove iOS auth permission prompt on sign-in/sign-out

Implemented the "Remove iOS auth permission prompt on sign-in/sign-out" feature.

### Changes

- Modified `apps/mobile/features/auth/useAuth.ts`:
  - Changed from using `clearSession()` to `clearCredentials()` for the `signOut` function
  - `clearCredentials()` clears locally stored credentials without opening a browser, avoiding the iOS permission prompt during logout
  - The sign-in flow already had `ephemeralSession: true` configured, which bypasses the permission prompt during sign-in

### How it works

The iOS authentication permission prompt ("zottie wants to use auth0.com to Sign In") appears when the app uses Safari's shared cookie storage. Two changes eliminate this prompt:

1. **Sign-in**: Using `ephemeralSession: true` (already implemented) tells iOS to use a private browser session instead of the shared Safari cookie jar

2. **Sign-out**: Using `clearCredentials()` instead of `clearSession()` clears only the locally stored credentials without opening a browser to clear the web session. Since we use ephemeral sessions, there's no persistent web session to clear anyway.

Trade-off: SSO across apps won't work, but this is acceptable for a standalone mobile app. The benefit is a smoother authentication experience without system permission prompts.

## 2026-01-17: Dismiss settings modal on logout

Implemented the "Dismiss settings modal on logout" feature.

### Changes

- Modified `apps/mobile/features/settings/SettingsScreen.tsx`:
  - Added `router.back()` call before clearing the query client and signing out
  - The modal now dismisses immediately when the user confirms logout, providing a seamless transition to the sign-in screen

### How it works

When the user taps "Log Out" from the settings screen and confirms in the alert dialog:
1. The settings modal dismisses via `router.back()`
2. The query cache is cleared
3. The sign-out process completes
4. The user lands on the sign-in screen without needing to manually dismiss the modal

This creates a smooth, expected user experience where the logout action transitions the user directly from settings to the sign-in screen.

## 2026-01-17: Add new conversation button to header

Implemented the "(Assistant Epic) Add new conversation button to header" feature.

### Changes

- Modified `apps/mobile/features/assistant/AssistantScreen.tsx`:
  - Added `useNavigation` import from expo-router and `useLayoutEffect` from React
  - Added `useLayoutEffect` hook that dynamically sets the header right button
  - Button only appears when there's an active conversation (`messages.length > 0 || isStreaming`)
  - Button uses the `add-circle-outline` icon in the primary action color
  - Tapping the button clears the conversation and returns to the initial state
  - Converted `handleNewConversation` to use `useCallback` for proper dependency tracking

### How it works

The Assistant tab header now shows a "new conversation" button (circle with plus icon) in the top-right corner when a conversation is active. Tapping this button:
- Clears all messages from the current conversation
- Clears any proposed actions
- Clears any execution results
- Returns the user to the initial state with the large voice button and canned prompts

When no conversation is active (initial state), the header button is hidden to keep the UI clean.

## 2026-01-17: Standard chat scroll behavior

Implemented the "(Assistant Epic) Standard chat scroll behavior" feature.

### Changes

- Modified `apps/mobile/features/assistant/AssistantScreen.tsx`:
  - Added `conversationContent` style that uses `flexGrow: 1` and `justifyContent: 'flex-end'` to push messages to the bottom
  - ScrollView now switches between `content` style (initial state with centered voice button) and `conversationContent` style (conversation mode with bottom-anchored messages)
  - New messages appear at the bottom, older messages scroll upward
  - Auto-scroll to bottom continues to work during streaming (already handled by existing useEffect)

### How it works

The Assistant chat now follows standard chat app conventions:
- Messages appear at the bottom of the screen
- New messages push older messages upward
- View stays anchored to the bottom so users always see the latest messages
- As the assistant streams its response, the view auto-scrolls to keep new content visible
- Initial state (with voice button and canned prompts) remains centered at top

## 2026-01-17: Anchor input at bottom of chat

Implemented the "(Assistant Epic) Anchor input at bottom of chat" feature.

### Changes

- Modified `apps/mobile/features/assistant/AssistantScreen.tsx`:
  - Restructured layout to use `KeyboardAvoidingView` wrapping the entire screen
  - Moved input controls to a fixed position at the bottom of the screen, outside the ScrollView
  - Created a new `MicButton` component for compact voice input in the input bar
  - Input bar contains a text field with a microphone button to the right
  - When text is entered, the mic button transforms into a send button
  - Tapping the mic button starts voice recording; tapping again stops and transcribes
  - Removed the inline "type a follow-up" element that appeared after messages
  - Removed the "or type instead" toggle since input is now always visible
  - Removed the separate "New conversation" button and VoiceInput from the conversation area
  - Added proper safe area handling for bottom padding

### How it works

The Assistant now follows standard chat app conventions:
- Text input field is always visible at the bottom of the screen
- Microphone button to the right of the text field for voice input
- When user types, mic button changes to send button
- Keyboard properly pushes the input bar up
- Initial state still shows the large voice button and canned prompts
- The input bar persists across all conversation states

## 2026-01-17: Include last purchase date in Assistant context

Implemented the "(Assistant Epic) Include last purchase date in Assistant context" feature.

### Changes

- Modified `apps/api/src/endpoints/assistantChat.ts`:
  - Added `formatItemWithPurchaseDate()` helper function that formats items with human-readable purchase dates (e.g., "milk (purchased yesterday)", "eggs (purchased 2 weeks ago)")
  - Updated `buildPantryContext()` to include purchase dates for items that have been purchased (in_stock and running_low items)
  - Purchase date display uses friendly relative time: "today", "yesterday", "X days ago", "X weeks ago", "X months ago"

### How it works

The AI Assistant now receives context like:

```
Current pantry inventory:
In stock (3): milk (purchased yesterday), eggs (purchased 3 days ago), bread
Running low (2): butter (purchased 2 weeks ago), flour
Out of stock (1): coffee
```

This allows the assistant to make better recommendations when users ask questions like "should I buy more milk?" - it can factor in when items were last purchased to assess freshness.
