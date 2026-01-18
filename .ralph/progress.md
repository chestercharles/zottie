# zottie Development Progress

## 2026-01-18: Swipe to toggle dormancy on pantry items

Implemented the "Swipe to toggle dormancy on pantry items" feature.

### Changes

- Modified `apps/mobile/features/pantry/PantryListScreen.tsx`:
  - Added `LeftSwipeActionButton` component for rendering left-swipe actions with animated appearance
  - Added `renderLeftActions` function to `PantryItemRow` that renders the dormancy toggle action
  - Added `onToggleDormancy` prop to `PantryItemRow` component
  - For non-dormant items: shows "Dormant" action with archive icon and muted tertiary color
  - For dormant items: shows "Activate" action with refresh icon and primary action color
  - Added `handleToggleDormancy` callback that toggles between `dormant` and `in_stock` status
  - Updated all three `PantryItemRow` usages (main list, planned items, dormant items) with the new prop
  - Enabled left swipe on `ReanimatedSwipeable` with `leftThreshold={40}` and `overshootLeft={false}`

### How it works

Users can now swipe left on any pantry item to toggle its dormancy:

1. **Non-dormant items**: Swiping left reveals a "Dormant" button with an archive icon in a muted gray color. Tapping it marks the item as dormant, moving it to the Dormant Items section at the bottom.

2. **Dormant items**: Swiping left on items in the Dormant Items section reveals an "Activate" button with a refresh icon in the primary action color. Tapping it reactivates the item by setting its status to `in_stock`, moving it back to the main pantry list.

The swipe action:
- Uses medium haptic feedback when triggered
- Animates smoothly with scale and opacity based on drag distance
- Follows the same visual pattern as existing right-swipe actions
- Works consistently across main list, planned items section, and dormant items section

## 2026-01-17: Display dormant items in separate section at bottom of pantry

Implemented the "Display dormant items in separate section at bottom of pantry" feature.

### Changes

- Modified `apps/mobile/features/pantry/hooks/usePantryItems.ts`:
  - Added `dormantItems` memoized array that filters items with `status === 'dormant'`
  - Updated `mainListItems` to exclude dormant items (filter by `status !== 'dormant'`)
  - Added `dormantItems` to the returned object from the hook

- Modified `apps/mobile/features/pantry/PantryListScreen.tsx`:
  - Added `isDormantExpanded` state for controlling section expansion
  - Destructured `dormantItems` from the `usePantryItems` hook
  - Added `renderListFooter` callback that renders the dormant items section
  - Connected the footer to FlatList via `ListFooterComponent`
  - Dormant section uses `colors.text.tertiary` to match the dormant status badge styling
  - Section follows the same collapsible pattern as Planned Items section

### How it works

Dormant items (items the user owns but doesn't intend to repurchase) are now visually separated from active pantry items:

1. Dormant items no longer appear in the main pantry list
2. A collapsible "Dormant Items" section appears at the bottom of the list
3. The section shows a count badge and expand/collapse chevron
4. When expanded, dormant items are displayed in rows (tappable to view/edit details)
5. The section uses a muted tertiary color to indicate these items are less actively tracked
6. Dormant items remain fully interactive - users can tap to view details

This keeps the main pantry view focused on items the user is actively tracking while still giving visibility to dormant items.

## 2026-01-17: Instructional shopping list empty state

Implemented the "(Education Epic) Instructional shopping list empty state" feature.

### Changes

- Modified `apps/mobile/features/shopping/ShoppingListScreen.tsx`:
  - Changed empty state title from "You're all set!" to "Your list is empty"
  - Changed empty state message from "Items that are running low or out of stock will appear here." to "Mark items in your Pantry as running low to add them here, or tap + to add items directly."
  - The "Add Planned Item" button remains as a direct action

### How it works

When the shopping list is empty, users now see an instructional empty state that:
1. Clearly indicates the list is empty ("Your list is empty")
2. Teaches the primary way to add items: marking pantry items as running low
3. Offers an alternative: tapping + to add items directly
4. Includes a button to immediately add a planned item

This completes the Education Epic by teaching users the connection between pantry status and shopping list directly in the UI, rather than passively describing what appears.

## 2026-01-17: First status change teaches shopping list connection

Implemented the "(Education Epic) First status change teaches shopping list connection" feature.

### Changes

- Created `apps/mobile/features/pantry/hooks/useStatusChangeEducation.ts`:
  - New hook that tracks whether the user has seen the education sheet using AsyncStorage
  - Exposes `triggerEducation()` to show the sheet and `dismissEducation()` to mark as seen
  - The `hasSeenEducation` flag is stored locally with key `hasSeenStatusChangeEducation`

- Created `apps/mobile/features/pantry/StatusChangeEducationSheet.tsx`:
  - Bottom sheet component explaining the shopping list connection
  - Shows a cart icon, title "Added to Shopping List", and explanation text
  - Uses the existing design system components (Card, Button, Text)
  - Follows iOS design patterns with spring physics

- Modified `apps/mobile/features/pantry/PantryListScreen.tsx`:
  - Integrated the education hook and sheet
  - Created `handleStatusChange` wrapper that triggers education on successful status changes
  - Updated all status change interactions (swipe actions, action sheets) to use the new handler

- Modified `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`:
  - Added the same education integration for status changes made from the detail screen
  - Only triggers for `running_low` or `out_of_stock` status changes

- Updated `apps/mobile/features/pantry/hooks/index.ts`:
  - Exported the new `useStatusChangeEducation` hook

### How it works

When a user marks an item as "running low" or "out of stock" for the first time ever:
1. The status change completes successfully
2. The hook checks if `hasSeenStatusChangeEducation` is false in AsyncStorage
3. If not seen, a bottom sheet appears explaining: "Items marked as running low or out of stock automatically appear on your shopping list. When you restock, just update the status."
4. User taps "Got it" to dismiss
5. The flag is saved to AsyncStorage so the education never shows again

This teaches the core value loop of zottie: pantry status changes automatically update the shopping list.

### Testing locally

The education state is stored in AsyncStorage on the device. To test this feature:
- Clear app data/reinstall the app to reset the storage
- Or clear the `hasSeenStatusChangeEducation` key from AsyncStorage via debugger

## 2026-01-17: Clarify onboarding prompt language

Implemented the "(Onboarding Epic) Clarify onboarding prompt language" feature.

### Changes

- Modified `apps/mobile/features/onboarding/NewShoppingListInputScreen.tsx`:
  - Changed the main prompt from "What do you need from the store?" to "What should we add to your shopping list?"
  - Updated the helper text from "Tap the microphone and list what you need from the store, or skip if you're all set for now." to "Tap the microphone and tell me what to add, or skip if you're all set for now."

### How it works

The new language directly connects user intent to where their items will appear. When users see "What should we add to your shopping list?", it creates a clear mental model:

1. They understand they're building a shopping list
2. They know exactly where their spoken items will end up
3. The language matches the destination (Shopping tab) they'll land on after onboarding

This completes the Onboarding Epic by ensuring all touchpoints use consistent, action-oriented language that sets accurate expectations.

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
