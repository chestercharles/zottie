# zottie Development Progress

## Use iOS-standard delete icon for swipe action

Changed the swipe action icon to consistently use the trash icon for both staples and planned items. Previously, staples showed a checkmark which was confusing since tapping already toggles checked state. Now both item types show the familiar iOS delete icon, making the swipe action's purpose immediately clear.

The underlying contextual behavior remains unchanged:
- **Staples**: Swipe action marks as "in stock" (green background)
- **Planned items**: Swipe action deletes entirely (red background)

Changes made to `apps/mobile/features/shopping/ShoppingListScreen.tsx`:
- Changed icon from conditional (`isStaple ? 'checkmark' : 'trash'`) to always use `'trash'`
