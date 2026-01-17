# zottie Development Progress

## Contextual swipe behavior for shopping list items

Implemented contextual swipe behavior based on item type:

- **Staples**: Swiping reveals a green checkmark button. Tapping marks the item as "in stock", which removes it from the shopping list but preserves it in the pantry. The item will reappear when marked running low again.
- **Planned items**: Swiping reveals a red trash button. Tapping deletes the item entirely since it was a one-time purchase.

Changes made to `apps/mobile/features/shopping/ShoppingListScreen.tsx`:
- Added `useUpdatePantryItem` hook import
- Added `isStaple` check to determine item type
- Changed swipe action button color: green for staples, red for planned
- Changed swipe action icon: checkmark for staples, trash for planned
- Added `handleSwipeAction` callback that routes to the appropriate mutation based on item type
- Renamed styles from `deleteButtonContainer`/`deleteButton` to `swipeActionContainer`/`swipeActionButton`
