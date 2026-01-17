# Zottie Design System

Purpose
This document defines the visual and interaction design system for Zottie.
It exists to ensure consistency, calmness, and user confidence — especially when UI is generated or modified by AI tools.

---

1. Design Principles

Zottie is classic, calm, and user-affirming. The interface should feel obvious, reassuring, and quietly confident.

- Prioritize clarity over cleverness
- Prefer familiar iOS patterns over novelty
- Avoid visual noise, harsh contrast, and unnecessary emphasis
- Design for confidence, not speed or density
- If a design choice feels flashy, it is probably wrong

UX Principles (Authoritative)
These rules override aesthetic preferences.

- Meet users where they are
- Supportive, never patronizing
- Errors are guidance, not failure
- User control and clarity
- Subtle, warm interactions
- Reassurance over perfection

---

2. Typography

Font Family

- System default fonts only
  - iOS: San Francisco (SF Pro)
  - Android: Roboto
- Do not introduce custom fonts

Text Roles and Scale

title.large size 28 weight semibold usage screen titles
title.medium size 22 weight semibold usage section headers
title.small size 18 weight semibold usage card titles
body.primary size 16 weight regular usage default body text
body.secondary size 14 weight regular usage supporting text
caption size 12 weight regular usage meta or helper text

Typography Rules

- Default text color: text.primary
- Avoid bold body text unless necessary for clarity
- Never use all-caps text

Dynamic Type

- All text must use scaled fonts via typography tokens
- Test layouts at largest accessibility sizes (AX5)
- Allow text to wrap rather than truncate at large sizes
- Critical UI elements must remain functional at all sizes
- Consider layout adaptation when text exceeds expected bounds

---

3. Spacing and Layout

Spacing Scale (base unit = 4)

space.xs 4
space.sm 8
space.md 16
space.lg 24
space.xl 32
space.2xl 48

Layout Guidelines

- Default screen padding: space.md
- Vertical rhythm is more important than horizontal symmetry
- Group related elements with spacing, not borders

---

4. Shape and Elevation

Corner Radius

radius.sm 6 usage inputs
radius.md 10 usage buttons
radius.lg 14 usage cards and sheets

Elevation

- Use elevation sparingly
- Prefer subtle shadows or surface color changes
- Never stack more than two elevation levels

---

5. Color System

Philosophy
Colors are semantic, not decorative.
Components reference meaning, not raw values.

Accent Color

- Primary accent: muted indigo
- Used for primary actions, focus states, and selection indicators
- Never use the accent color for large backgrounds

Semantic Color Tokens

Text

- text.primary
- text.secondary
- text.tertiary
- text.inverse

Surfaces

- surface.background
- surface.grouped
- surface.elevated
- surface.overlay

Borders and Dividers

- border.subtle
- border.strong

Feedback

- feedback.success
- feedback.warning
- feedback.error
- feedback.info

Actions

- action.primary
- action.primaryPressed
- action.secondary
- action.disabled

Light and dark mode values must be defined per token.
Never hardcode hex values in components.

---

6. Components (Moderately Opinionated)

Buttons

- Primary button
  - Background: action.primary
  - Text: text.inverse
  - Radius: radius.md
- Secondary button
  - Background: transparent
  - Text: action.primary
- Avoid destructive emphasis unless truly destructive

Inputs

- Always visible label
- No placeholder-only inputs
- Error states are calm and instructional
- Use border color changes, not red fills

Cards

- Background: surface.elevated
- Radius: radius.lg
- Padding: space.md
- Cards are containers, not buttons unless explicitly interactive

Lists

- Prefer native list patterns
- Use dividers sparingly
- Tappable rows must have clear affordance

Swipe Actions

- Place destructive actions (delete) on trailing side with red background
- Place non-destructive actions (edit, archive) on leading side
- Full-swipe should trigger the primary action for that direction
- Include haptic feedback when crossing action thresholds
- Swipe actions should have both icon and label when space permits

---

7. Motion and Feedback

Motion Principles

- Subtle, continuous, and reassuring
- Use spring animations
- Avoid spinners when possible

Haptics

- Light impact for selections and minor confirmations
- Medium impact for meaningful actions (delete, complete, toggle)
- Use notification haptics appropriately:
  - Success: task completion, successful submission
  - Warning: destructive action confirmation dialogs
  - Error: validation failure, operation failure (use sparingly)
- Never overuse haptics — they should feel meaningful, not noisy

---

8. Accessibility

- Minimum contrast WCAG AA
- Touch targets at least 44pt
- All icons must have labels or accessibility text
- Do not rely on color alone to convey meaning

---

9. Safe Areas

- Always use SafeAreaView or safe area insets for edge content
- Bottom content must respect home indicator area
- Headers must account for notch and Dynamic Island
- Tab bars and toolbars should extend into safe area with proper insets
- Test on devices with different safe area configurations

---

10. Navigation Patterns

- Use push navigation for drill-down hierarchy (detail screens)
- Use modal sheets for quick actions that don't leave context
- Use full-screen modals for focused tasks (compose, edit, multi-step flows)
- All modals must support swipe-to-dismiss
- Use large titles for top-level screens, standard titles for detail screens
- Place primary actions in the navigation bar, not as floating buttons

Sheet Presentations

- Prefer .medium detent for quick selection or preview
- Use .large detent for content that needs more space
- Allow users to expand sheets by dragging

---

11. Icons

- Use SF Symbols as the primary icon source
- Match symbol weight to adjacent text weight
- Use semantic symbol names (e.g., "trash" not "delete-icon")
- Prefer monochrome rendering for most UI; hierarchical for emphasis
- Ensure all icons scale appropriately with Dynamic Type

---

12. Context Menus

- Support long-press context menus on interactive list items
- Group related actions with separators
- Place destructive actions at the bottom with red text
- Include relevant preview when appropriate
- Keep menu items concise (2-3 words)

---

13. Pointer and Trackpad (iPad)

- Provide hover states for interactive elements
- Use pointer lift effect for buttons and tappable cards
- Support keyboard shortcuts for common actions
- Ensure focus states are visible for keyboard navigation

---

14. AI Usage Rules

When generating UI:

- Always use semantic tokens
- Do not invent new sizes, colors, or radii
- If unsure, choose the calmer option
- Prefer standard patterns over creativity
- When in doubt, ask for clarification rather than guessing

---

15. Design Smell Checklist

Avoid:

- Visual noise
- Over-emphasis
- Trendy gradients
- Tiny text
- Dense layouts
- Decorative animations

If something feels cool, reconsider it.
