# zottie Development Progress

## 2026-01-17: Add choice when removing item from shopping list

**Feature:** When swiping to remove an item from the shopping list, users now see two options: "Already have it" and "Don't want to buy it". This addresses the case where someone buys salmon occasionally but doesn't want it automatically added to their shopping list every time they run out.

**Changes:**

Backend (apps/api):
- Updated `apps/api/src/db/schema.ts`:
  - Added 'dormant' to the `pantryItemStatus` array
- Updated `apps/api/src/types.ts`:
  - Added 'dormant' to the `PantryItemStatusEnum` Zod schema

Mobile (apps/mobile):
- Updated `apps/mobile/features/pantry/types.ts`:
  - Added 'dormant' to the `PantryItemStatus` type
- Updated `apps/mobile/features/shopping/types.ts`:
  - Added 'dormant' to the `PantryItemStatus` type
- Updated `apps/mobile/features/shopping/ShoppingListScreen.tsx`:
  - Replaced direct swipe action with `ActionSheetIOS` showing two options
  - "Already have it" marks item as `in_stock`
  - "Don't want to buy it" marks item as `dormant`
  - Changed swipe button to neutral color (action.primary) with ellipsis icon
  - Removed unused `deletePantryItem` mutation and import
- Updated `apps/mobile/components/ui/StatusBadge.tsx`:
  - Added 'dormant' to the `PantryStatus` type and labels
  - Added tertiary text color for dormant status badge
- Updated `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`:
  - Added 'dormant' to status labels and status picker options

**Technical Details:**

1. Dormant status behavior:
   - Items marked as dormant are filtered out of the shopping list (same filter as in_stock)
   - Dormant items remain in the pantry but won't appear on shopping list until status is changed
   - Users can manually change an item back from dormant via the pantry detail screen

2. ActionSheetIOS flow:
   - Swipe reveals a button with ellipsis icon (neutral styling)
   - Tapping shows ActionSheetIOS with item name as title
   - Two action options plus Cancel
   - Both options use the existing `updatePantryItem` mutation

3. Shopping list filtering (unchanged):
   - Only shows items with status: `running_low`, `out_of_stock`, or `planned`
   - `in_stock` and `dormant` items are automatically filtered out

**Verification:**

- API TypeScript type checking passed
- Mobile linting passed
- Mobile TypeScript type checking passed
- Tests passed

## 2026-01-17: Add in-memory conversation history to Assistant tab

**Feature:** Display conversation history in the Assistant tab. Conversations persist during the app session (surviving tab switches) but clear when the app is closed/restarted.

**Changes:**

Backend (apps/api):
- Updated `apps/api/src/endpoints/assistantChat.ts`:
  - Accepts optional `history` array in request body (previous messages)
  - Pantry context is now included in the system prompt (fetched fresh each request)
  - Builds OpenAI message history from: system prompt + pantry context + history + new message
  - Simplified: no database persistence, no conversation IDs

Mobile (apps/mobile):
- Updated `apps/mobile/features/assistant/api.ts`:
  - `streamAssistantChat` now accepts `history` array of previous messages
  - Added `HistoryMessage` type
- Updated `apps/mobile/features/assistant/hooks/useStreamAssistant.ts`:
  - Stores full message history in `messages` array (React state)
  - Adds user message to local state immediately when sending
  - Sends message history to backend with each request
  - Appends assistant message to history when stream completes
  - `reset()` clears the local messages array
  - Added `Message` type export
- Updated `apps/mobile/features/assistant/hooks/index.ts`:
  - Exported `Message` type
- Updated `apps/mobile/features/assistant/AssistantScreen.tsx`:
  - Displays all messages from conversation history using `MessageBubble` component
  - Removed single `transcript`/`response` state in favor of `messages` array
  - Conversation survives tab switches (screen stays mounted in Expo Router tabs)

**Technical Details:**

1. In-memory conversation flow:
   - Messages stored in React state within `useStreamAssistant` hook
   - Each API call sends the full history to the backend
   - Backend injects fresh pantry context into system prompt on every request
   - If pantry changes mid-conversation, next message sees updated state

2. Session lifecycle:
   - Conversation persists: switching tabs within the app
   - Conversation clears: closing/restarting the app, tapping "New conversation"

3. Simplified architecture:
   - No database tables for conversations
   - No conversation ID tracking
   - Client is the source of truth for conversation history

**Verification:**

- ✅ API TypeScript type checking passed
- ✅ Mobile linting passed
- ✅ Mobile TypeScript type checking passed

## 2026-01-17: Add text input option to Assistant tab

**Feature:** Added a secondary text input field to the Assistant tab for when voice isn't convenient

**Changes:**

- Updated `apps/mobile/features/assistant/AssistantScreen.tsx`:
  - Added state for text input value and visibility toggle
  - Initial state: Added "or type instead" link below voice button that reveals text input
  - Text input mode: Shows input field with send button and "or use voice instead" link to toggle back
  - Conversation state: Added text input row above the "New conversation" button and voice button
  - Text input styled with grouped surface background and send button with arrow icon
  - Send button disabled state when input is empty
  - Keyboard dismisses on submit
  - Auto-focuses text input when toggling to text mode

**Technical Details:**

1. Two input modes in initial state:
   - Voice mode (default): Large voice button with "or type instead" link below
   - Text mode: Input field with send button, "or use voice instead" link to switch back

2. Conversation state improvements:
   - Text input always visible at the bottom with placeholder "Type a follow-up..."
   - Voice button available alongside text input for users who prefer voice
   - Layout: text input row → "New conversation" button + voice button row

3. UX considerations:
   - Voice remains the primary interaction (shown first, larger button)
   - Text input is secondary but easily accessible
   - Both options available in conversation view for user preference
   - Consistent styling with the rest of the app's design system

**Verification:**

- ✅ Mobile linting passed
- ✅ Mobile TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Make Assistant responses brief and plain-text

**Feature:** Updated the Assistant's response style to be brief and use only plain text without markdown formatting

**Changes:**

- Updated `apps/api/src/endpoints/assistantChat.ts`:
  - Rewrote the system prompt to be more concise and explicit about response requirements
  - Added clear instruction: responses should be 1-2 sentences max
  - Explicitly prohibits markdown formatting (asterisks, bullet points, headers, code blocks)
  - Maintains the warm, helpful tone per UX principles
  - Kept tool calling instructions for proposing pantry actions

**Technical Details:**

The previous system prompt mentioned being "concise" with "2-4 sentences" but didn't explicitly prohibit markdown or enforce brevity strictly enough. The LLM was still producing verbose responses with markdown formatting that rendered as raw text in the chat UI.

The new prompt is more direct:
- "Keep responses SHORT - just 1-2 sentences max"
- "Never use markdown formatting (no asterisks, bullet points, headers, or code blocks)"
- "Write in plain conversational text only"

This ensures responses feel quick and conversational, matching the app's UX principles of being supportive without being lengthy or documentation-like.

**Verification:**

- ✅ API TypeScript type checking passed

## 2026-01-17: Add human-in-the-loop tool calling to Assistant

**Feature:** The Assistant can now propose actions like adding items or updating statuses, and users can approve or reject changes before they're executed

**Changes:**

Backend (apps/api):
- Updated `apps/api/src/endpoints/assistantChat.ts`:
  - Added OpenAI function calling with `propose_pantry_actions` tool
  - Tool allows proposing add/update actions for pantry items
  - Streaming response includes proposed actions appended after text content
  - Uses `[PROPOSED_ACTIONS]` marker to delineate actions JSON from text
  - Updated system prompt to be proactive about suggesting actions

Mobile (apps/mobile):
- Updated `apps/mobile/features/assistant/hooks/useStreamAssistant.ts`:
  - Added `ProposedAction` and `ProposedActions` types
  - Parses stream response to extract proposed actions from marker
  - Added `proposedActions` state and `clearProposedActions` function
  - Separates text response from actions JSON during parsing
- Updated `apps/mobile/features/assistant/hooks/index.ts`:
  - Exported new types
- Updated `apps/mobile/features/assistant/api.ts`:
  - Added `executeAssistantActions` function to call `/api/commands/execute`
- Updated `apps/mobile/features/assistant/AssistantScreen.tsx`:
  - Added confirmation card UI for proposed actions
  - Shows summary and list of actions with icons
  - "Do it" button to approve, "Not now" to reject
  - Loading state while executing
  - Success/error feedback after execution
  - Haptic feedback on approve/reject
  - Invalidates pantry queries after successful execution

**Technical Details:**

1. Tool calling flow:
   - User speaks request like "add milk and eggs to shopping list"
   - LLM receives request with pantry context and available tools
   - If LLM wants to take action, it calls `propose_pantry_actions` tool
   - Tool arguments are streamed back with `[PROPOSED_ACTIONS]` marker
   - Frontend parses the marker and displays confirmation UI

2. Action execution:
   - Uses existing `/api/commands/execute` endpoint
   - Reuses `CommandAction` types for compatibility
   - Invalidates `pantryItems` query to refresh all views

3. UX considerations:
   - Actions show icons: cart for shopping list, checkmark for pantry updates
   - Brief summary from LLM explains what will happen
   - User always has clear approve/reject choice
   - Success notification with item count
   - Haptic feedback for both approve and reject actions

**Verification:**

- ✅ API TypeScript type checking passed
- ✅ Mobile linting passed
- ✅ Mobile TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Enable canned prompt buttons on Assistant tab

**Feature:** Made the canned prompt buttons functional so they trigger LLM conversations

**Changes:**

- Updated `apps/mobile/features/assistant/AssistantScreen.tsx`:
  - Modified `handlePromptPress` to find the prompt by ID and initiate a conversation
  - When tapped, the prompt label is set as the user message (transcript) and sent to the LLM
  - Reuses existing `streamMessage` function from the streaming hook

**Technical Details:**

1. The implementation is straightforward because the infrastructure was already in place:
   - The streaming hook (`useStreamAssistant`) handles LLM communication
   - The conversation UI already displays user messages and streaming responses
   - The canned prompt buttons just needed to trigger the same flow as voice input

2. Flow when user taps a canned prompt:
   - Look up the prompt by ID in the `CANNED_PROMPTS` array
   - Set the prompt label as the `transcript` state (displayed as user message bubble)
   - Call `streamMessage` with the prompt label to send it to the LLM
   - The streaming response appears in the assistant message bubble
   - User can continue the conversation with voice input or start a new conversation

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Connect Assistant to streaming LLM backend

**Feature:** Added streaming LLM integration to the Assistant tab, allowing users to speak and receive real-time AI responses with context about their pantry inventory

**Changes:**

Backend (apps/api):
- Created `apps/api/src/endpoints/assistantChat.ts`:
  - New streaming endpoint at POST `/api/assistant/chat`
  - Uses OpenAI API with GPT-4o-mini model for cost-effective responses
  - Streams response text back to client in real-time
  - Includes user's pantry context (items grouped by status) in system prompt
  - Handles authentication and household membership validation
- Updated `apps/api/src/index.ts`:
  - Registered new assistant chat endpoint

Mobile (apps/mobile):
- Created `apps/mobile/features/assistant/api.ts`:
  - Async generator function `streamAssistantChat` that yields text chunks
  - Uses `ReadableStream` reader to process streaming response
- Created `apps/mobile/features/assistant/hooks/useStreamAssistant.ts`:
  - Custom hook managing streaming state (idle, streaming, error)
  - Handles authentication, accumulates response text
  - Provides `streamMessage` function and `reset` for new conversations
- Created `apps/mobile/features/assistant/hooks/index.ts`:
  - Module export for hooks
- Updated `apps/mobile/features/assistant/AssistantScreen.tsx`:
  - Integrated streaming hook
  - Chat-style UI with user message bubble (right-aligned, primary color)
  - Assistant response bubble (left-aligned, grouped background)
  - "Thinking..." indicator with spinner while waiting for first token
  - Auto-scrolls to bottom as response streams in
  - "New conversation" button and smaller voice input for follow-ups
  - Error display with warm styling
- Updated `apps/mobile/features/assistant/index.ts`:
  - Exported new hook

**Technical Details:**

1. Streaming implementation:
   - Backend uses OpenAI's streaming API with `stream: true`
   - Returns `ReadableStream` wrapped in Response with `text/event-stream` content type
   - Client uses `ReadableStream` reader and `TextDecoder` to process chunks
   - Hook accumulates chunks into full response via React state

2. Pantry context:
   - LLM receives categorized pantry inventory (in stock, running low, out of stock, planned)
   - Enables contextual responses about what user has available
   - System prompt emphasizes read-only nature - assistant can answer but not take actions

3. UI states:
   - Initial state: Large voice button + canned prompts
   - Conversation state: Chat bubbles + actions at bottom
   - Streaming state: "Thinking..." indicator until first token arrives
   - Error state: Warm error message with guidance

**Verification:**

- ✅ API TypeScript type checking passed
- ✅ Mobile linting passed
- ✅ Mobile TypeScript type checking passed
- ✅ Mobile tests passed

## 2026-01-17: Enable voice input on Assistant tab

**Feature:** Made the voice button on the Assistant tab functional with speech-to-text transcription display

**Changes:**

- Updated `apps/mobile/features/assistant/AssistantScreen.tsx`:
  - Replaced the placeholder voice button with the existing `VoiceInput` component
  - Added state to track the transcribed text
  - Added a transcript display card that shows "You said:" followed by the transcribed text
  - Wrapped content in `ScrollView` to accommodate transcript display
  - Configured contextual strings for speech recognition (pantry, shopping, meal, recipe, etc.)

**Technical Details:**

1. Integration with existing `VoiceInput` component:
   - Reuses the fully-featured voice input component from `components/VoiceInput.tsx`
   - Leverages `expo-speech-recognition` for on-device speech recognition
   - Inherits animations (recording pulse, processing state) and haptic feedback

2. Screen layout updates:
   - Voice button remains at 120x120 size with status text below
   - Transcript appears in a card below the status text when available
   - Canned prompts section remains at the bottom
   - Content wrapped in ScrollView for better layout when transcript is long

3. UX details:
   - Custom status text: "Tap to speak with your assistant" → "Listening..." → "Processing..."
   - Transcript card uses `surface.grouped` background with `radius.lg` corners
   - Shows "You said:" label above the transcribed text for clarity

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Add Assistant tab with voice button and canned prompts

**Feature:** Added a new "Assistant" tab to the app with a prominent voice input button and canned prompt buttons

**Changes:**

- Created `apps/mobile/features/assistant/AssistantScreen.tsx`:
  - Large circular voice button (primary action color) with microphone icon
  - Helper text explaining "Tap to speak with your assistant"
  - Four canned prompt buttons: "Update pantry items", "Help me plan meals", "Add to shopping list", "What's in my pantry?"
  - Prompt buttons styled as cards with icons and labels
- Created `apps/mobile/features/assistant/index.ts` for module exports
- Created `apps/mobile/app/(authenticated)/assistant.tsx` as the route entry point
- Updated `apps/mobile/app/(authenticated)/_layout.tsx` to add the Assistant tab with chatbubble-outline icon

**Technical Details:**

1. Screen layout:
   - Voice button positioned near the top center (120x120 circular button)
   - Subtle shadow on voice button for elevation
   - Canned prompts section below with full-width buttons
   - Each prompt button has an icon and label in a row layout

2. Placeholder handlers:
   - `handleVoicePress` and `handlePromptPress` are placeholder functions
   - Actual functionality will be added in subsequent PRDs

3. Design system compliance:
   - Uses semantic color tokens (`colors.action.primary`, `colors.surface.grouped`, etc.)
   - Uses spacing tokens for consistent layout
   - Uses radius tokens for button corners
   - Uses design system Text component with variants

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Move edit name action to overflow menu on item detail

**Feature:** Added "Edit Name" option to the overflow menu and removed direct tap-to-edit behavior from the item name

**Changes:**

- Updated `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`:
  - Added "Edit Name" option to the `ActionSheetIOS` overflow menu
  - Removed the `TouchableOpacity` wrapper and pencil icon from the item name display
  - Item name now displays as plain text when not editing
  - Added `autoFocus` to the text input so the keyboard appears immediately when editing
  - Removed unused `nameContainer` style

**Technical Details:**

1. Problem: Users could edit the item name by tapping directly on it (shown with a pencil icon), but this interaction wasn't very discoverable. Users might not realize the name is tappable.

2. Solution:
   - Added "Edit Name" as the first option in the existing overflow menu (after Cancel)
   - Tapping "Edit Name" triggers `setIsEditingName(true)` which shows the inline edit UI
   - The inline editing experience (text input with Cancel/Save buttons) remains unchanged
   - Added `autoFocus` to the text input so the keyboard appears immediately when entering edit mode
   - Removed the pencil icon and tap behavior from the name display for a cleaner look

3. UX improvements:
   - Edit action is now discoverable via the overflow menu
   - Consistent with the delete action also being in the overflow menu
   - Makes the edit action intentional rather than accidental
   - Cleaner item detail screen without the pencil icon

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Move delete action to overflow menu on item detail

**Feature:** Moved the delete action from a prominent red button at the bottom of the edit item screen to an overflow menu in the header

**Changes:**

- Updated `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`:
  - Added ellipsis overflow menu button in the header area next to the drag handle
  - Removed the large red "Delete Item" button from the bottom of the screen
  - Added `showOverflowMenu` function using `ActionSheetIOS` with a "Delete Item" option
  - Delete confirmation alert is preserved - tapping "Delete Item" in the overflow menu still shows the confirmation dialog
  - Removed unused `ActivityIndicator` import

**Technical Details:**

1. Problem: The delete button was visually prominent (large red button) and took up significant space at the bottom of the screen. This was unnecessary visual weight since users don't need to see the delete option every time they view item details.

2. Solution:
   - Added an ellipsis icon (`ellipsis-horizontal`) in the top-right of the sheet header
   - The ellipsis button is balanced by an invisible spacer on the left to keep the drag handle centered
   - Tapping the ellipsis shows an `ActionSheetIOS` with "Delete Item" marked as destructive
   - The existing delete confirmation flow is preserved - selecting "Delete Item" triggers the same Alert.alert confirmation
   - The header layout uses flexbox with `space-between` to position: spacer | drag-handle | overflow-button

3. UX improvements:
   - Cleaner, less cluttered item detail screen
   - Delete action is accessible but not prominent
   - Follows iOS convention of placing overflow/more actions in an ellipsis menu
   - Maintains 44pt minimum touch target for accessibility

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Pulsing loading state for status change buttons

**Feature:** Added a subtle pulsing animation to status buttons during API updates instead of hiding all buttons and showing a loader

**Changes:**

- Updated `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`:
  - Added `StatusButton` component with animated pulsing effect using react-native-reanimated
  - Added `pendingStatus` state to track which status is being updated
  - Status buttons now remain visible during updates
  - The clicked button shows a subtle opacity pulsing animation until the API confirms the change
  - Disabled all status buttons during pending state to prevent double-clicks

**Technical Details:**

1. Problem: The previous implementation replaced all status buttons with an ActivityIndicator + "Updating..." text during mutations. This caused a jarring flash and layout shift.

2. Solution:
   - Created a `StatusButton` component that accepts an `isPulsing` prop
   - When pulsing, the button's opacity animates between 1.0 and 0.5 using `withRepeat` + `withSequence` + `withTiming`
   - Animation uses 600ms duration with `Easing.inOut(Easing.ease)` for a smooth, breathing effect
   - When the mutation completes (success or error), `pendingStatus` is cleared and the animation stops
   - The clicked button immediately appears as "active" (highlighted) while pulsing to show the intended selection

3. UX improvements:
   - No layout shift during loading
   - User sees immediate visual feedback on their selection
   - Subtle breathing animation feels warm and engaging per design system guidelines
   - All buttons remain visible so users maintain spatial context

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Remove Edit Item header title and fix Settings header spacing

**Feature:** Two header adjustments for bottom sheet modals to improve visual consistency

**Changes:**

- Removed the "Edit Item" title from `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`
- Added more vertical space between the drag handle and "Settings" title in `apps/mobile/features/settings/SettingsScreen.tsx`
- Removed unused `sheetHeader` style from PantryItemDetailScreen

**Technical Details:**

1. Edit Item Screen:
   - The "Edit Item" title was redundant since the item name is already prominently displayed and serves as contextual header
   - Removed the `sheetHeader` View that wrapped the title text
   - The screen now shows: DragHandle → Item Name (editable) → Status section → Details section

2. Settings Screen:
   - Added `paddingTop: spacing.md` to the header View to increase spacing between the drag handle and "Settings" title
   - This creates better visual separation and follows iOS sheet conventions

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Simplify details section on edit item screen

**Feature:** Removed redundant item name and status from the Details section on the edit item screen

**Changes:**

- Removed the "Item Name" row from the Details card in `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`
- Removed the "Status" row from the Details card

**Technical Details:**

The Details section was showing information already visible elsewhere on the screen:

1. Item Name - Already prominently displayed in the header at the top
2. Status - Already shown and selectable in the "Change Status" section with highlighted current status

The Details section now only contains useful, non-redundant information:
- Last Purchased (when available)
- Created date
- Last Updated date

This simplifies the UI by eliminating duplicate information, making the screen cleaner and easier to scan.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Add swipe gesture to dismiss pantry search

**Feature:** Added upward swipe gesture to dismiss the pantry search interface

**Changes:**

- Enabled the pan gesture handler in `SearchOverlay` component in `apps/mobile/features/pantry/PantryListScreen.tsx`
- Wrapped the search overlay content with `GestureDetector` to capture swipe gestures
- Gesture detects upward swipes and dismisses search when sufficient distance or velocity is reached

**Technical Details:**

The gesture handler was previously implemented but commented out. The implementation:

1. Uses `Gesture.Pan()` from `react-native-gesture-handler` with:
   - `activeOffsetY([-8, 8])` - activates after 8px vertical movement
   - `failOffsetX([-15, 15])` - fails if horizontal movement exceeds 15px (to allow text selection)
2. Only tracks upward movement (negative translationY)
3. Dismisses if either:
   - Distance exceeds 60px upward, OR
   - Velocity exceeds 800px/s upward
4. If not dismissed, springs back to original position with smooth animation
5. Clears search term and closes search mode on dismiss (same behavior as X button)

The gesture threshold was adjusted from requiring BOTH distance AND velocity to requiring EITHER, making the gesture more forgiving and natural.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Fix item name alignment on edit item screen

**Feature:** Aligned the item name on the edit item screen with the content inside the Card sections below it

**Changes:**

- Added `paddingHorizontal: spacing.md` to the header section in `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`

**Technical Details:**

The item name was misaligned because it sat directly inside the content wrapper (with `padding: spacing.md`), while the sections below used `Card` components that add their own internal `padding: spacing.md`. This meant the item name was `spacing.md` from the screen edge, while Card content was `spacing.md + spacing.md` from the edge.

The fix adds matching horizontal padding to the header section so the item name aligns with the text inside the Cards below it.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Add confirmation before marking items as purchased

**Feature:** Added a confirmation alert before marking checked items as purchased in the shopping list

**Changes:**

- Updated `handleMarkAsPurchased` in `apps/mobile/features/shopping/ShoppingListScreen.tsx`:
  - Added an `Alert.alert` confirmation dialog before executing the mark as purchased action
  - Alert shows the number of items being marked (e.g., "Mark 3 items as purchased?")
  - Provides context: "They'll be moved to your pantry as in-stock."
  - Two-button design following iOS HIG: "Cancel" (default) and "Mark Purchased"

**Technical Details:**

Following iOS Human Interface Guidelines for confirmation patterns:

1. Two-button alerts provide an easy choice between two alternatives
2. Cancel button is listed first, making it the default (bold) option per iOS convention
3. Action button uses a clear verb phrase ("Mark Purchased") that describes the result
4. Message explains what will happen to help users make an informed decision

This prevents accidental taps on the cart icon in the header from immediately marking items as purchased, giving users a chance to confirm their intent.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Move Mark as Purchased action to header

**Feature:** Relocated the "Mark as Purchased" button from the bottom of the shopping list to the navigation header

**Changes:**

- Updated `apps/mobile/features/shopping/ShoppingListScreen.tsx`:
  - Added cart icon with badge to the header right section that appears when items are checked
  - Badge shows the count of checked items
  - Removed the large bottom "Mark as Purchased" button container
  - Kept the "Reset checkmarks" option in a simpler bottom container
  - Added new styles for header elements (`headerRight`, `headerPurchaseButton`, `headerBadge`, `headerBadgeText`)
  - Wrapped `handleMarkAsPurchased` in `useCallback` for proper dependency handling
  - Moved `useLayoutEffect` for header options to after `checkedCount` is defined

**Technical Details:**

The previous implementation showed a large green "Mark as Purchased" button at the bottom of the screen whenever items were checked. This was too prominent and obstructed scrolling while actively shopping.

The new implementation:

1. Shows a cart icon with a green badge (showing checked count) in the header next to the add button
2. Cart icon only appears when at least one item is checked
3. Tapping the cart icon triggers the mark as purchased flow
4. Shows loading indicator in place of the cart icon during the mutation
5. Keeps the "Reset checkmarks" link at the bottom for users who want to uncheck all items

This follows iOS design patterns where primary actions are placed in the navigation header rather than floating at the bottom.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Remove redundant status display on edit item page

**Feature:** Removed the redundant status badge from the edit item page

**Changes:**

- Removed `<StatusBadge status={currentStatus} />` from the header section in `apps/mobile/features/pantry/PantryItemDetailScreen.tsx`
- Removed unused `StatusBadge` import

**Technical Details:**
The edit item page was showing the item's status twice:

1. A `StatusBadge` component displayed below the item name in the header
2. The status picker section below with the current status highlighted

This was redundant since users could already see their current status highlighted in the status picker. Removing the standalone StatusBadge simplifies the UI and eliminates the duplication.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Fix edit item sheet handle position

**Feature:** Positioned the drag handle above the "Edit Item" title to match the Settings page pattern

**Changes:**

- Updated `apps/mobile/app/(authenticated)/pantry/_layout.tsx` to set `headerShown: false` for the `[id]` screen
- Added a custom "Edit Item" header in `apps/mobile/features/pantry/PantryItemDetailScreen.tsx` below the DragHandle
- Added `sheetHeader` style for centered alignment

**Technical Details:**
The edit item screen was using the default Stack navigation header which placed the "Edit Item" title above the DragHandle component rendered inside the screen. This was inconsistent with the Settings page, which uses `headerShown: false` and renders a custom header below the DragHandle.

The fix follows the Settings page pattern:

1. Hide the Stack navigation header
2. Render DragHandle at the very top of the screen
3. Render a custom centered header with the title below the DragHandle

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Auto-sort checked shopping list items to bottom

**Feature:** Checked shopping list items now automatically move to the bottom of the list

**Changes:**

- Added `sortedItems` memoized value in `apps/mobile/features/shopping/ShoppingListScreen.tsx`
- Sorting logic separates items into two groups: unchecked items (shown first) and checked items (shown last)
- Both groups maintain their original alphabetical order from the API
- Updated `FlatList` to render `sortedItems` instead of `items`

**Technical Details:**

- Uses `useMemo` to efficiently recompute the sorted list only when `items` or `checkedIds` change
- Maintains alphabetical order within each group (unchecked and checked)
- Mirrors iOS Notes app behavior for shopping list organization
- When users check items while shopping, they automatically move to the bottom keeping unchecked items prominently visible at the top

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed

## 2026-01-17: Clear search filter when dismissing search box

**Feature:** Fixed pantry search dismiss behavior to properly clear search filter

**Changes:**

- Refactored `toggleSearchMode` function in `apps/mobile/features/pantry/PantryListScreen.tsx` to separate concerns
- Created `openSearchMode()` and `closeSearchMode()` functions for explicit state control
- Updated `closeSearchMode()` to properly clear both the search mode state and search term when dismissing
- Updated SearchOverlay to use `closeSearchMode` instead of toggle for the dismiss button
- Maintained backward compatibility by keeping `toggleSearchMode` for the header search button

**Technical Details:**
The issue was that the previous implementation called `setSearchTerm('')` inside the `setIsSearchMode` state updater callback, which could cause timing issues with React's state batching. The new implementation explicitly calls both state updates in sequence when closing search mode, ensuring the search filter is always cleared when the user dismisses the search box.

**Verification:**

- ✅ Linting passed
- ✅ TypeScript type checking passed
- ✅ Tests passed
