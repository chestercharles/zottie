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
- Respect system Dynamic Type settings

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

---

7. Motion and Feedback

Motion Principles

- Subtle, continuous, and reassuring
- Use spring animations
- Avoid spinners when possible

Haptics

- Light haptics for confirmations
- Never use haptics for errors or warnings

---

8. Accessibility

- Minimum contrast WCAG AA
- Touch targets at least 44pt
- All icons must have labels or accessibility text
- Do not rely on color alone to convey meaning

---

9. AI Usage Rules

When generating UI:

- Always use semantic tokens
- Do not invent new sizes, colors, or radii
- If unsure, choose the calmer option
- Prefer standard patterns over creativity
- When in doubt, ask for clarification rather than guessing

---

10. Design Smell Checklist

Avoid:

- Visual noise
- Over-emphasis
- Trendy gradients
- Tiny text
- Dense layouts
- Decorative animations

If something feels cool, reconsider it.
