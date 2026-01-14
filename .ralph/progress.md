# zottie Development Progress

## 2026-01-13: Commands parsing empathetic error responses

Implemented personalized, empathetic error messages when the commands parsing endpoint cannot identify actions from user input.

### What was built

- Enhanced OpenAI system prompt to generate contextual, empathetic error messages
- Updated backend response schema to include optional `message` field
- Modified `CommandParseEndpoint` to return helpful messages when no actions are found
- Updated frontend `CommandsScreen` to display backend-provided error messages
- Added e2e tests to verify error message generation

### Error message behavior

When the parsing endpoint receives input that isn't related to pantry or shopping tasks, it now:
- References what the user actually said to show understanding
- Explains why it couldn't process the input
- Provides specific recommendations based on context
- Keeps responses short (two sentences max)
- Uses a supportive tone without being patronizing

### Examples

- User says "what's the weather" → "I can't check the weather, but I can help with your pantry and shopping list. Try saying 'add milk' or 'mark eggs as running low'."
- User says "hello" → "Hi! I'm here to help manage your pantry and shopping list. Try telling me to 'add apples' or 'mark bread as out of stock'."
- User says "remind me to call mom" → "I can't set reminders, but I can track your pantry items. Try saying 'add tomatoes' or 'we're out of pasta'."

### Technical changes

- `apps/api/src/types.ts`: Added optional `message` field to `CommandParseResponse`
- `apps/api/src/endpoints/commandParse.ts`: Updated prompt and response handling to generate personalized messages
- `apps/mobile/features/commands/types.ts`: Updated frontend type to include optional `message`
- `apps/mobile/features/commands/CommandsScreen.tsx`: Display backend message when available
- `apps/api/src/endpoints/commandParse.eval.ts`: Added tests for empathetic error responses

## 2026-01-13: Commands tab screen with dictation and execution

Implemented the Commands tab in the mobile app, allowing users to give voice commands to manage their pantry and shopping list.

### What was built

- Added `expo-speech-recognition` dependency for speech-to-text functionality
- Created `commands` feature module with:
  - `CommandsScreen.tsx`: Main UI component with microphone button and confirmation flow
  - `api.ts`: API client for parse and execute endpoints
  - `types.ts`: TypeScript types for command actions
  - `hooks/useCommandMutations.ts`: React Query hooks for parsing and executing commands
- Added Commands tab to the bottom navigation with mic icon
- Integrated with existing backend parse and execute endpoints

### User flow

1. User taps the microphone button on the Commands tab
2. App requests microphone permission (if needed)
3. Speech recognition starts, button turns red while listening
4. When user finishes speaking, transcription is sent to parsing endpoint
5. Parsed actions are displayed in a list for confirmation (e.g., "Add apples to pantry (in stock)")
6. User can confirm or cancel the actions
7. On confirm, actions are executed via the execution endpoint
8. Pantry and shopping list queries are invalidated to refresh the UI

### Features

- Clean, centered UI with large microphone button that changes color based on state:
  - Blue: idle
  - Red: recording
  - Orange: processing
- Contextual strings provided to speech recognition for better accuracy (pantry, shopping, in stock, running low, out of stock)
- Action confirmation screen shows formatted descriptions of what will be executed
- Loading states during parsing and execution
- Error handling with clear error messages
- Cancel functionality to discard parsed actions

### Technical implementation

- Used `expo-speech-recognition` for on-device speech recognition
- Speech recognition events handled via hooks (start, end, result, error)
- Confirmation UI conditionally rendered based on state (confirming vs executing)
- Actions are displayed in a scrollable list with checkmark icons
- Confirm and cancel buttons at the bottom with proper disabled states during execution

## 2026-01-13: Commands execution backend endpoint

Implemented the `POST /api/commands/execute` endpoint that executes structured actions from command parsing.

### What was built

- Created `CommandExecuteEndpoint` that:
  - Accepts an array of actions in the same format returned by the parsing endpoint
  - Executes each action (add_to_pantry, update_pantry_status, remove_from_shopping_list)
  - Returns a count of successfully executed and failed actions
  - Handles edge cases intelligently (e.g., adding an item that already exists will update it instead)

### Action execution logic

- `add_to_pantry`: Creates a new pantry item if it doesn't exist, or updates the existing item's status if it does
- `update_pantry_status`: Updates an existing item's status, or creates a new item with that status if it doesn't exist
- `remove_from_shopping_list`: Updates an existing item's status to `in_stock` and sets the `purchasedAt` timestamp

### Smart behavior

- When marking an item as `in_stock` from any other status, the `purchasedAt` timestamp is automatically set
- The execution endpoint can be tested independently of the parsing endpoint since it accepts the same structured format
- Failed actions don't stop execution - the endpoint continues processing remaining actions and returns counts of both successful and failed operations

### Tests

Created comprehensive e2e tests covering:
- Basic action execution for all three action types
- Multiple actions in a single request
- Handling existing items correctly
- Creating items when they don't exist
- Graceful failure handling

## 2026-01-13: Commands parsing backend endpoint

Implemented the `POST /api/commands/parse` endpoint that processes natural language commands using OpenAI.

### What was built

- Added OpenAI package dependency
- Created Zod schemas for command actions (`CommandAction`, `CommandParseRequest`, `CommandParseResponse`)
- Created `CommandParseEndpoint` that:
  - Fetches user's current pantry items for context
  - Sends the command to GPT-4o-mini with a system prompt explaining the action types
  - Returns structured actions that the frontend can display and execute

### Supported action types

- `add_to_pantry`: Add a new item with a specified status
- `update_pantry_status`: Update an existing item's status
- `remove_from_shopping_list`: Mark an item as in_stock (removing it from shopping consideration)

### Smart intent handling

The AI is instructed to be smart about user intent - if a user says "mark apples as running low" but apples aren't in the pantry, it will return an `add_to_pantry` action with status `running_low` rather than failing.

### Configuration required

The `OPENAI_API_KEY` environment variable must be set (as a secret in production, or in `.dev.vars` locally)
