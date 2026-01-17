# zottie Development Progress

## Update success color to teal

Replaced the bright green success color with a teal/cyan color that better aligns with zottie's warm, empathetic personality. The previous green (#32D74B in dark mode, #34C759 in light mode) felt too technical and "hackery" - more appropriate for developer tools than a household app about cooking and meal prep.

Changes:
- Updated dark mode success color from `#32D74B` (bright green) to `#2DD4BF` (teal)
- Updated light mode success color from `#34C759` (iOS green) to `#14B8A6` (darker teal for light backgrounds)
- The new teal maintains the positive/success semantic meaning while feeling calmer and more modern
- Both colors are from the same teal family for visual consistency between modes

Affected UI components that use `feedback.success`:
- StatusBadge: "In Stock" status badges in pantry
- ShoppingListScreen: Checkmarks on completed shopping items, purchase action button
- CommandsScreen: Checkmark for completed commands
- JoinScreen: Success icons in household join flow

## Direct swipe-to-delete on shopping list items

Simplified the delete interaction for shopping list items from a two-step action (swipe to reveal button, then tap) to a single direct swipe gesture.

Changes:
- Replaced `ReanimatedSwipeable` with a custom `Gesture.Pan()` implementation for direct swipe control
- When user swipes left past 100px threshold, the item animates sliding off screen and is deleted immediately
- Red delete background progressively reveals with trash icon as user swipes
- Added haptic feedback (medium impact) when crossing the delete threshold
- Item slides off with a smooth 200ms ease-out animation before triggering deletion
- Removed the two-button swipe action (Purchased/Delete) in favor of the streamlined single gesture
- Users can still mark items as purchased using the checkbox or the bulk "Mark as purchased" button

The interaction now follows iOS HIG for destructive swipe actions with appropriate gesture thresholds, spring animations for snap-back, and visual feedback during the swipe.

## Fix add planned item sheet dismissal navigation

Fixed a bug where dismissing the "add planned item" bottom sheet on the shopping list screen would incorrectly navigate to the pantry screen instead of staying on the shopping list.

Changes:
- Added `pressBehavior="close"` to explicitly control backdrop tap behavior
- Added `enableTouchThrough={false}` to prevent touch events from passing through the backdrop to the underlying FlatList
- This prevents accidental item taps when the sheet is being dismissed, which was triggering navigation to the pantry item detail screen

## Smoother search overlay animation on Pantry screen

Adjusted the search overlay animation to feel more native and polished by using critically-damped spring physics that don't overshoot.

Changes:
- Updated spring animation parameters in SearchOverlay component from `damping: 20, stiffness: 300` to `damping: 28, stiffness: 400, mass: 0.8`
- The new parameters create a smooth slide-in without the bouncy overshoot that felt inconsistent with iOS native search bar behavior
- Animation now feels like iOS Settings/Mail app search animations - quick and smooth with no bounce

## Move drag handle above Settings modal header

Moved the drag handle to appear at the very top of the Settings modal, above the title, to match iOS modal presentation conventions.

Changes:
- Set `headerShown: false` for the settings route in the pantry layout to hide the navigation-provided header
- Added a custom header section in SettingsScreen with the drag handle at the top followed by a centered "Settings" title
- The drag handle is now the first visual element at the top edge of the modal sheet

## Add drag handle to Pantry Edit Item modal

Added an iOS-standard drag handle (pill-shaped grabber bar) to the top of the Edit Item modal to indicate it can be dismissed by swiping down.

Changes:
- Added DragHandle import from components/ui in PantryItemDetailScreen
- Added DragHandle component at the top of the ScrollView, before the content
- Reuses the existing DragHandle component from components/ui

## Add drag handle to Pantry Add Item modal

Added an iOS-standard drag handle (pill-shaped grabber bar) to the top of the Add Item modal to indicate it can be dismissed by swiping down.

Changes:
- Added DragHandle component to CreatePantryItemScreen at the top of the modal
- Wrapped the form content in a View with padding to maintain proper layout
- Reuses the existing DragHandle component from components/ui

## Add drag handle to Settings modal

Added an iOS-standard drag handle (pill-shaped grabber bar) to the top of the Settings modal to indicate it can be dismissed by swiping down.

Changes:
- Created reusable `DragHandle` component in `components/ui/DragHandle.tsx`
- Component renders a 36x5px pill-shaped bar centered at the top
- Uses `colors.border.strong` for proper visibility in both light and dark modes
- Added DragHandle to the SettingsScreen at the top of the modal
- Exported DragHandle from the components/ui index

## Design system audit for add item bottom sheets

Updated both the "Add Pantry Item" and "Add Shopping Item" bottom sheets to fully conform with the design system, fixing dark mode background issues.

Changes:
- Added `backgroundStyle` with `colors.surface.elevated` to both BottomSheet components so they properly adapt to dark mode
- Added `backgroundColor: colors.surface.background` to text inputs in both bottom sheets for proper contrast in dark mode
- Updated ShoppingListScreen to use `typography.body.primary.fontSize` instead of hardcoded `fontSize: 16`
- Added `typography` to the useTheme destructuring in ShoppingListScreen

## In-app theme toggle

Added a theme toggle to the Settings screen that allows users to choose between Light, Dark, or System (default) appearance.

Changes:
- Created `ThemeContext.tsx` with ThemeProvider that persists user preference to AsyncStorage
- ThemeProvider resolves the color scheme based on user preference (or falls back to system when set to "System")
- Updated `useTheme` hook to use the resolved color scheme from ThemeContext
- Added ThemeProvider wrapper to root layout in `_layout.tsx`
- Added an Appearance section to Settings screen with a segmented control for Light/Dark/System options
- The segmented control follows iOS design patterns with a grouped background and elevated selected state
- Exported `ThemeProvider`, `useThemePreference`, and `ThemePreference` type from theme module

## Move pantry settings gear to left side of navigation

Moved the settings gear icon from the right side of the Pantry screen navigation header to the left side to reduce accidental taps.

Changes:
- Added `headerLeft` navigation option with the settings gear icon
- Removed the settings gear from `headerRight`
- Right side now only has search and add (+) icons, which are more frequently used
- Reduces accidental taps when reaching for primary actions

## Pantry search overlay keyboard behavior

Improved the keyboard behavior of the pantry search overlay to follow standard iOS search patterns.

Changes:
- Pressing the keyboard's return/search key now dismisses the keyboard but keeps the overlay visible with filtered results
- Tapping the large X button to exit search mode now properly dismisses both the keyboard and the overlay simultaneously
- The small X clear button inside the input continues to clear text without dismissing overlay or keyboard (already working)
- Auto-focus on the search input when the overlay appears (already working)

## iOS Calendar-style search overlay for pantry

Implemented an animated search overlay that slides down from the top of the pantry screen when the search icon is tapped, following iOS Calendar-style patterns. The overlay covers the navigation area and contains a search input with clear functionality.

Changes:
- Created `SearchOverlay` component with spring animations using react-native-reanimated
- Overlay slides down with `withSpring` animation (damping: 20, stiffness: 300) for native iOS feel
- Search input with placeholder "Search pantry items..."
- Small X button inside the input to clear the current search term
- Large X button to exit search mode entirely and dismiss the overlay
- Auto-focuses input when overlay appears
- Pantry list padding adjusts when search mode is active to accommodate the overlay
- Uses existing filtering logic from `usePantryItems` hook

## Pantry search icon in navigation header

Added a magnifying glass search icon to the pantry screen's navigation header, positioned to the left of the existing add (+) and settings icons. Tapping the icon triggers entry into search mode (state is tracked via `isSearchMode`). Removed the always-visible inline search bar from the main content area, so the pantry list now shows all items without the search input taking up space when not in search mode.

Changes:
- Added `isSearchMode` state to track search mode
- Added search icon to `headerRight` in navigation options
- Removed inline search bar from pantry list content
- Search icon color changes to primary action color when search mode is active
- Added accessibility labels to all header icons
