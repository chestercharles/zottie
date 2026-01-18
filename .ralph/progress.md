# zottie Development Progress

## 2026-01-18: Go-tos management UI

Implemented the "(Go-tos Epic) Go-tos management UI" feature.

### Changes

#### Backend API

- Modified `apps/api/src/db/schema.ts`:
  - Added `gotos` table with fields: id, householdId, createdBy, name, needs, createdAt, updatedAt
  - Added `Goto` and `NewGoto` types

- Modified `apps/api/src/types.ts`:
  - Added `GotoCreate`, `GotoUpdate`, and `Goto` Zod schemas for request/response validation

- Created `apps/api/src/endpoints/gotoList.ts`:
  - Lists all go-tos for the authenticated user's household

- Created `apps/api/src/endpoints/gotoCreate.ts`:
  - Creates a new go-to with name and needs, attributed to the current user

- Created `apps/api/src/endpoints/gotoUpdate.ts`:
  - Updates an existing go-to's name and/or needs

- Created `apps/api/src/endpoints/gotoDelete.ts`:
  - Deletes a go-to

- Modified `apps/api/src/index.ts`:
  - Registered routes for `/api/gotos` (GET, POST) and `/api/gotos/:id` (PATCH, DELETE)

- Generated migration `apps/api/drizzle/0001_concerned_lockheed.sql` for the gotos table

#### Mobile App

- Created `apps/mobile/features/gotos/types.ts`:
  - Defined `Goto` interface and request/response types

- Created `apps/mobile/features/gotos/api.ts`:
  - API client functions: `createGoto`, `listGotos`, `updateGoto`, `deleteGoto`

- Created `apps/mobile/features/gotos/hooks/useGotos.ts`:
  - Query hook for fetching and caching go-tos

- Created `apps/mobile/features/gotos/hooks/useGotoMutations.ts`:
  - Mutation hooks: `useCreateGoto`, `useUpdateGoto`, `useDeleteGoto`

- Created `apps/mobile/features/gotos/GotosListScreen.tsx`:
  - List screen showing go-to cards with name, truncated needs preview, and creator attribution
  - Empty state with call-to-action button
  - Pull-to-refresh support
  - Header "+" button to create new go-to

- Created `apps/mobile/features/gotos/GotoCreateScreen.tsx`:
  - Modal screen for creating a new go-to
  - Name input and multiline needs text area
  - Microphone button for voice input to the needs field
  - Cancel and save buttons in header

- Created `apps/mobile/features/gotos/GotoDetailScreen.tsx`:
  - Modal screen for viewing/editing an existing go-to
  - Same form layout as create screen
  - Voice input support for needs field
  - Delete option at the bottom with confirmation alert

- Modified `apps/mobile/lib/query/keys.ts`:
  - Added `gotos` query key

- Created route files in `apps/mobile/app/(authenticated)/gotos/`:
  - `_layout.tsx`: Stack navigator with modal presentations
  - `index.tsx`: Routes to GotosListScreen
  - `create.tsx`: Routes to GotoCreateScreen
  - `[id].tsx`: Routes to GotoDetailScreen

- Modified `apps/mobile/app/(authenticated)/_layout.tsx`:
  - Added "Go-tos" tab with bookmark icon between Shopping and Assistant tabs
  - Settings gear accessible from the Go-tos tab header

### How it works

Users can now save and manage go-to meals from a dedicated tab:

1. **List view**: Shows cards for each go-to with the name, a preview of what it needs, and who created it (e.g., "by Chester")

2. **Creating a go-to**: Tap "+" in the header. Enter a name (e.g., "Pork and Beans") and what it needs (e.g., "salt pork, pinto beans, lots of butter"). Can use the microphone to dictate the needs field.

3. **Editing a go-to**: Tap any card to open the detail screen. Edit name or needs, then tap the checkmark to save. Changes are saved to the server and the list updates automatically.

4. **Deleting a go-to**: From the detail screen, tap "Delete Go-to" at the bottom. Confirm in the alert dialog.

5. **Voice input**: Both create and edit screens have a microphone button next to the "Needs" label. Tap to start recording, speak the ingredients, tap again to stop. Transcribed text is appended to the needs field.

Go-tos are shared at the household level - all household members see the same go-tos and can create, edit, or delete any of them. The creator attribution helps users understand who added each go-to.

This feature lays the foundation for the Assistant integration (companion PRD), where the Assistant will be able to use go-tos when helping with shopping lists.
