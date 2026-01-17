# Design System Refactor Plan

This plan migrates the Zottie mobile app to conform to DESIGN_SYSTEM.md. Work through each phase in order, checking off items as completed.

---

## Phase 1: Foundation - Design Tokens

Create the infrastructure that all components will use.

### 1.1 Color Tokens
- [x] Create `lib/theme/colors.ts` with semantic color tokens
  - Text tokens: `text.primary`, `text.secondary`, `text.tertiary`, `text.inverse`
  - Surface tokens: `surface.background`, `surface.grouped`, `surface.elevated`, `surface.overlay`
  - Border tokens: `border.subtle`, `border.strong`
  - Feedback tokens: `feedback.success`, `feedback.warning`, `feedback.error`, `feedback.info`
  - Action tokens: `action.primary`, `action.primaryPressed`, `action.secondary`, `action.disabled`
- [x] Define light mode values
- [x] Define dark mode values
- [x] Choose specific hex value for "muted indigo" accent

### 1.2 Spacing Tokens
- [x] Create `lib/theme/spacing.ts` with spacing scale
  - `space.xs`: 4
  - `space.sm`: 8
  - `space.md`: 16
  - `space.lg`: 24
  - `space.xl`: 32
  - `space.2xl`: 48

### 1.3 Typography Tokens
- [x] Create `lib/theme/typography.ts` with text styles
  - `title.large`: size 28, weight semibold
  - `title.medium`: size 22, weight semibold
  - `title.small`: size 18, weight semibold
  - `body.primary`: size 16, weight regular
  - `body.secondary`: size 14, weight regular
  - `caption`: size 12, weight regular

### 1.4 Shape Tokens
- [x] Create `lib/theme/shape.ts` with radius values
  - `radius.sm`: 6 (inputs)
  - `radius.md`: 10 (buttons)
  - `radius.lg`: 14 (cards, sheets)

### 1.5 Theme Infrastructure
- [x] Create `lib/theme/index.ts` barrel export
- [x] Create `lib/theme/useTheme.ts` hook for consuming tokens (handles light/dark mode)
- [x] Integrate theme hook with system color scheme preference

---

## Phase 2: Core Components

Build reusable components using the design tokens. Each component should use tokens exclusively (no hardcoded values).

### 2.1 Text Components
- [x] Create `components/ui/Text.tsx` with variants matching typography tokens
  - Props: `variant` (title.large, title.medium, etc.), `color` (semantic token)
  - Respects system Dynamic Type settings

### 2.2 Button Components
- [x] Create `components/ui/Button.tsx`
  - Primary variant: `action.primary` background, `text.inverse` text, `radius.md`
  - Secondary variant: transparent background, `action.primary` text
  - Disabled state using `action.disabled`
  - Minimum 44pt touch target

### 2.3 Card Component
- [x] Create `components/ui/Card.tsx`
  - Background: `surface.elevated`
  - Radius: `radius.lg`
  - Padding: `space.md`

### 2.4 Input Components
- [x] Create `components/ui/TextInput.tsx`
  - Always visible label (no placeholder-only inputs)
  - Radius: `radius.sm`
  - Error states use border color changes, not red fills
  - Calm, instructional error messages

### 2.5 Status Badge Component
- [x] Create `components/ui/StatusBadge.tsx` for pantry item statuses
  - Uses semantic feedback colors
  - Consistent styling across the app

### 2.6 List Item Component
- [x] Create `components/ui/ListItem.tsx`
  - Clear tap affordance
  - Consistent padding using spacing tokens
  - Optional swipe actions support

### 2.7 Empty State Component
- [x] Create `components/ui/EmptyState.tsx`
  - Consistent empty state pattern across screens
  - Uses typography and spacing tokens

### 2.8 Update Component Barrel Export
- [x] Update `components/index.ts` to export all new UI components

---

## Phase 3: Refactor VoiceInput Component

The existing complex component needs token adoption.

- [x] Replace hardcoded colors in `components/VoiceInput.tsx`
  - Blue `#3498DB` → `action.primary`
  - Red `#E74C3C` → `feedback.error`
  - Orange `#F39C12` → `feedback.warning`
  - Gray values → semantic surface/text tokens
- [x] Update spacing to use spacing tokens
- [x] Update border radius to use shape tokens
- [x] Ensure animations use spring physics (already does)

---

## Phase 4: Refactor Feature Screens

Update each screen to use design tokens and new components.

### 4.1 Landing Screen
- [x] `features/landing/LandingScreen.tsx`
  - Replace hardcoded colors with tokens
  - Use Button component for CTAs
  - Use Text component for typography
  - Update spacing to use tokens

### 4.2 Home Screen
- [x] `features/home/HomeScreen.tsx`
  - Replace green `#2ECC71` and red `#E74C3C` with semantic tokens
  - Use Button component
  - Use Card component for sections
  - Update spacing and typography

### 4.3 Pantry Screens
- [x] `features/pantry/PantryListScreen.tsx`
  - Replace status color mapping with StatusBadge component
  - Replace blue `#3498DB` accent with `action.primary`
  - Use ListItem component for pantry items
  - Use EmptyState component
  - Update all spacing and typography

- [x] `features/pantry/PantryItemDetailScreen.tsx`
  - Use Card component for detail sections
  - Use Button component for actions
  - Replace hardcoded colors with tokens
  - Update spacing and typography

- [x] `features/pantry/CreatePantryItemScreen.tsx`
  - Use TextInput component with labels
  - Use Button component
  - Replace hardcoded colors with tokens
  - Update spacing and typography

### 4.4 Shopping Screen
- [x] `features/shopping/ShoppingListScreen.tsx`
  - Use ListItem component
  - Use EmptyState component
  - Replace hardcoded colors with tokens
  - Update spacing and typography

### 4.5 Commands Screen
- [x] `features/commands/CommandsScreen.tsx`
  - Integrate with refactored VoiceInput
  - Replace hardcoded colors with tokens
  - Update spacing and typography

### 4.6 Settings Screen
- [x] `features/settings/SettingsScreen.tsx`
  - Replace blue `#3498DB` with `action.primary`
  - Replace red `#E74C3C` with `feedback.error` (for destructive actions)
  - Use ListItem component for settings rows
  - Use Card component for sections
  - Update spacing and typography

### 4.7 Onboarding Screens
- [x] `features/onboarding/NewPantryInputScreen.tsx`
  - Use TextInput component
  - Use Button component
  - Replace hardcoded colors with tokens
  - Update spacing and typography

- [x] `features/onboarding/NewShoppingListInputScreen.tsx`
  - Use TextInput component
  - Use Button component
  - Replace hardcoded colors with tokens
  - Update spacing and typography

- [x] `features/onboarding/NewHouseholdInvitationScreen.tsx`
  - Use Button component
  - Use Card component
  - Replace hardcoded colors with tokens
  - Update spacing and typography

- [x] `features/onboarding/CreateHouseholdScreen.tsx`
  - Use TextInput component
  - Use Button component
  - Replace hardcoded colors with tokens
  - Update spacing and typography

- [x] `features/onboarding/NewProcessingScreen.tsx`
  - Replace hardcoded colors with tokens
  - Ensure loading animations are subtle (no harsh spinners)
  - Update spacing and typography

- [x] `features/onboarding/ConversationalOnboarding.tsx`
  - Use Text component for chat messages
  - Replace hardcoded colors with tokens
  - Update spacing and typography

- [x] `features/onboarding/OriginalOnboarding.tsx`
  - Use new components throughout
  - Replace hardcoded colors with tokens
  - Update spacing and typography

### 4.8 Household Screens
- [x] `features/household/JoinScreen.tsx`
  - Use TextInput component
  - Use Button component
  - Replace hardcoded colors with tokens
  - Update spacing and typography

---

## Phase 5: Navigation & Layout Updates

### 5.1 Tab Bar Styling
- [x] Update `app/(authenticated)/_layout.tsx`
  - Tab bar colors use semantic tokens
  - Active/inactive states use proper action tokens

### 5.2 Header Styling
- [x] Review all screen headers for consistent styling
  - Header backgrounds use `surface.background`
  - Header text uses `text.primary`

### 5.3 Root Layout
- [x] Update `app/_layout.tsx`
  - Ensure theme provider is integrated
  - Status bar styling matches theme

---

## Phase 6: Accessibility Audit

### 6.1 Contrast Check
- [x] Verify all text/background combinations meet WCAG AA
- [x] Test with iOS accessibility inspector

### 6.2 Touch Targets
- [x] Audit all interactive elements for 44pt minimum
- [x] Fix any undersized touch targets

### 6.3 Screen Reader Support
- [x] Verify all icons have accessibility labels
- [x] Test with VoiceOver

---

## Phase 7: Dark Mode Support

### 7.1 Implementation
- [x] Ensure useTheme hook responds to system preference
- [x] Test all screens in dark mode
- [x] Fix any contrast or visibility issues

### 7.2 Testing
- [x] Manual test: light mode
- [x] Manual test: dark mode
- [x] Manual test: system preference switching

---

## Phase 8: Final Cleanup

### 8.1 Remove Dead Code
- [x] Remove any unused color constants
- [x] Remove any unused style definitions
- [x] Remove any orphaned components

### 8.2 Documentation
- [x] Update AGENTS.md to reference design system usage
- [x] Add usage examples to component files

### 8.3 Verification
- [x] Run `pnpm run lint`
- [x] Run `pnpm run tsc`
- [x] Run `pnpm run test`
- [x] Manual testing of all screens

---

## Progress Tracking

| Phase | Items | Completed | Status |
|-------|-------|-----------|--------|
| 1. Foundation | 10 | 10 | Complete |
| 2. Core Components | 9 | 9 | Complete |
| 3. VoiceInput | 4 | 4 | Complete |
| 4. Feature Screens | 15 | 15 | Complete |
| 5. Navigation | 3 | 3 | Complete |
| 6. Accessibility | 3 | 3 | Complete |
| 7. Dark Mode | 4 | 4 | Complete |
| 8. Final Cleanup | 6 | 6 | Complete |
| **Total** | **54** | **54** | **100%** |

---

## Notes

- Each checkbox item should be a single commit or small group of related commits
- Test after each phase before moving to the next
- If a screen has minimal styling, it may only need token updates (no new components)
- Prioritize high-traffic screens (Pantry, Shopping) over rarely-used screens
