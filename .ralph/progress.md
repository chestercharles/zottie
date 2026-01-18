# zottie Development Progress

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
