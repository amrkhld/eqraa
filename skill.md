# Sleek Arabic Dark-Red Web Design Skill

## Purpose

Create a modern, sleek, clean, relaxed Arabic UI with a premium dark-red visual identity. The interface should feel refined and spacious rather than dense, flashy, or overly decorative.

The design is **mobile-first**, fully responsive, and should expand naturally to tablets and desktop without losing the calm visual hierarchy of the mobile layout.

---

## 1. Core Visual Direction

### Overall feel

- Sleek
- Clean
- Modern
- Premium
- Calm
- Smooth
- Spacious
- Confident
- Minimal but not empty
- Dark and atmospheric without looking aggressive

### Primary visual language

- Main color: **dark red**
- Supporting color: **black / near-black**
- Use transparent black and transparent dark-red surfaces heavily.
- Prefer subtle tonal variation over excessive decoration.
- Use soft gradients to create depth instead of shadows.
- Keep the interface visually lightweight.

### Hard prohibitions

Do **not** use:

- Drop shadows
- Box shadows
- Text shadows
- Glow effects
- Neon effects
- Glassmorphism with bright highlights
- Hard borders
- Thin outline borders used as decoration
- Sharp rectangular corners
- Dense layouts
- Elements touching or visually merging into one another
- Excessive gradients
- Overly bouncy or playful animations
- Excessive blur used as decoration
- Visually noisy backgrounds

Depth should come from **color, transparency, spacing, layering through opacity, and restrained gradients**, never from shadows or glows.

---

## 2. Color System

Use a dark-red-to-black visual system.

### Suggested base palette

```css
:root {
  --red-950: #2a0508;
  --red-900: #3b080d;
  --red-800: #520b12;
  --red-700: #6f1018;
  --red-600: #8b1720;
  --red-500: #a51e29;

  --black-950: #050505;
  --black-900: #090909;
  --black-850: #0d0d0d;
  --black-800: #121212;
  --black-700: #181818;

  --white: #ffffff;
  --text-primary: rgba(255, 255, 255, 0.94);
  --text-secondary: rgba(255, 255, 255, 0.68);
  --text-muted: rgba(255, 255, 255, 0.46);

  --surface-black: rgba(0, 0, 0, 0.28);
  --surface-black-strong: rgba(0, 0, 0, 0.42);
  --surface-red: rgba(111, 16, 24, 0.30);
  --surface-red-strong: rgba(111, 16, 24, 0.46);
}
```

These values are starting points, not rigid requirements. Preserve the same visual relationship if the project has an existing palette.

### App background

The application itself should use a dark-red-to-black gradient background.

Preferred direction:

```css
background:
  linear-gradient(
    145deg,
    #3b080d 0%,
    #180608 38%,
    #080808 72%,
    #050505 100%
  );
```

The gradient should feel atmospheric and understated. It should never look like a colorful marketing gradient.

### Black fade gradients

Use black-to-transparent fades for depth, readability, and visual transitions.

Examples:

```css
background: linear-gradient(to bottom, rgba(0,0,0,0.78), transparent);
```

```css
background: linear-gradient(to top, rgba(0,0,0,0.82), transparent);
```

Use these especially for:

- Hero image readability
- Navigation overlays
- Bottom content fades
- Media cards
- Large visual sections
- Page transition backgrounds

Do not add decorative gradients just because a component can technically support one.

---

## 3. Surfaces

Surfaces should look integrated into the background rather than like floating cards.

### Preferred surface style

Use transparent black and dark-red surfaces:

```css
background: rgba(0, 0, 0, 0.28);
```

or

```css
background: rgba(59, 8, 13, 0.34);
```

Use stronger opacity when content needs stronger separation:

```css
background: rgba(0, 0, 0, 0.44);
```

### Surface rules

- No borders.
- No shadows.
- No glow.
- Use rounded corners.
- Use generous internal padding.
- Separate surfaces through whitespace and tonal contrast.
- Do not create unnecessary nested cards.

A surface should feel like a soft visual zone, not a boxed-off container.

---

## 4. Buttons

Buttons are primarily transparent black or dark-red.

### Primary button

Use a dark-red translucent surface with strong readable text.

```css
background: rgba(111, 16, 24, 0.72);
color: #fff;
```

### Secondary button

Use transparent black:

```css
background: rgba(0, 0, 0, 0.40);
color: rgba(255,255,255,0.90);
```

### Button rules

- No borders.
- No box shadow.
- No glow.
- Never use sharp corners.
- Use medium-to-large corner radii.
- Give buttons comfortable horizontal and vertical padding.
- Do not visually glue adjacent buttons together.
- Separate multiple buttons with a clear gap.
- Prefer one strong primary action and quieter secondary actions.

### Arabic RTL Action Order & Alignment

In Arabic interfaces (RTL), natural eye-scanning proceeds from **right to left**:

- **Primary Action First**: In dialog footers, forms, and action bars, the primary action (e.g. `إنشاء`, `حفظ`, `تأكيد`) should appear **first** in the natural RTL reading order (on the right), followed by secondary actions (`إلغاء`, `رجوع`) to its left:
  ```text
  [ إلغاء (ثانوي) ]  ←  [ إنشاء (رئيسي) ]
  (يسار)                  (يمين)
  ```
- **Avoid Placing Cancel First**: Never place the secondary/cancel button where an Arabic reader's eye lands first when scanning the action group.
- **Visual Weight**: The primary action must always have the distinct dark-red surface (`var(--surface-red-strong)` or `var(--red-600)`), while secondary actions use the quieter transparent black (`var(--surface-black)`).
- **Dialog Alignment**: In dialogs, actions should be grouped cleanly with `gap: var(--space-3)`. Placing the primary action on the leading right side ensures maximum clarity and prevents accidental dismissals.

### Button interaction

Buttons should feel responsive but controlled.

Recommended states:

```css
transition:
  transform 180ms ease,
  background-color 180ms ease,
  opacity 180ms ease;
```

Hover:

- Slightly increase surface brightness/opacity.
- Translate upward by approximately `-1px` to `-2px`.

Active:

- Translate downward slightly.
- Reduce opacity minimally.

Do not use springy scaling, glowing outlines, or exaggerated motion.

---

## 5. Border Policy

The default rule is:

> **No borders.**

Do not solve separation problems with borders.

Use instead:

1. Spacing
2. Background contrast
3. Transparency
4. Typography hierarchy
5. Subtle black/red tonal changes

Only use a border when a third-party component or an accessibility requirement genuinely requires one. When absolutely necessary, make it extremely subtle and visually subordinate.

---

## 6. Corner Radius

Nothing should feel sharp.

Use rounded corners throughout the interface.

Suggested scale:

```css
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 18px;
--radius-xl: 24px;
--radius-2xl: 32px;
--radius-pill: 999px;
```

Guidelines:

- Small controls: `10px–14px`
- Buttons and inputs: `14px–18px`
- Cards and panels: `18px–24px`
- Hero / major containers: `24px–32px`
- Pills / chips: `999px`

Do not mix radically different corner styles within one component family.

---

## 7. Spacing Philosophy

Whitespace is one of the main visual design tools.

### Golden rule

> **Nothing should cling to anything else.**

Every meaningful element needs breathing room around it.

Ensure there is always visible spacing:

- Between the viewport edge and page content
- Between navigation and content
- Between sections
- Between cards
- Between card content and card edges
- Between text groups
- Between buttons
- Between icons and labels
- Between form fields

### Mobile starting scale

Use a comfortable mobile baseline:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 32px;
--space-8: 40px;
--space-9: 48px;
--space-10: 64px;
--space-11: 80px;
```

Preferred page padding on mobile:

```css
padding-inline: 16px;
```

Use `20px` or `24px` where more breathing room benefits the composition.

Never allow the main content to visually touch the screen edges.

### Desktop expansion

On larger screens:

- Increase section spacing.
- Increase outer page padding.
- Increase max content width rather than stretching everything indefinitely.
- Preserve readable line lengths.
- Use multi-column layouts only when they improve hierarchy.

---

## 8. Typography

The interface is **Arabic-first and RTL**.

### Font hierarchy

#### Titles and major headers

Use:

> **Reem Kufi**

Use it for:

- Page titles
- Hero titles
- Major headings
- Large section headings
- Prominent numerical/statistical headings when appropriate

The type should feel distinctive and confident.

#### Default application typography

Use:

> **Amiri**

Use it for most of the product interface:

- Body text
- Descriptions
- Form labels
- Navigation labels
- Supporting text
- Helper text
- Longer Arabic content

### Typography rules

- Arabic is RTL by default.
- Keep line-height generous.
- Avoid overly tight text blocks.
- Use weight and size for hierarchy rather than decorative treatments.
- Do not use text shadows.
- Avoid excessive font-weight changes.
- Do not make every heading oversized.

### Direction

The document should normally use:

```html
<html dir="rtl" lang="ar">
```

Respect natural Arabic reading flow for layout, alignment, icon placement, and spacing.

---

## 9. Layout System

Build mobile-first.

### Mobile first principle

Start with a compact single-column layout optimized for touch interaction.

Then progressively enhance:

- `sm`: improve spacing and grouping
- `md`: introduce denser but still comfortable layouts
- `lg`: use columns, wider containers, side navigation, dashboards, or split views where useful
- `xl`: increase content width and whitespace, not visual clutter

Do not design the desktop layout first and simply shrink it for mobile.

### Content width

Use a maximum content width where appropriate:

```css
max-width: 1280px;
margin-inline: auto;
```

For text-heavy content, use narrower reading widths.

### Grid / flex

Use grid and flexbox deliberately.

Do not create layouts where unrelated elements visually stack over each other.

Avoid accidental overlaps except where layering is explicitly part of the design, such as:

- Media overlays
- Hero text over imagery
- Floating controls
- Bottom navigation overlays

Even layered elements must remain visually legible and intentionally spaced.

---

## 10. Components

Every reusable component must have a consistent visual rhythm and interaction behavior.

Reusable components include, but are not limited to:

- Buttons
- Icon buttons
- Inputs
- Selects
- Dropdowns
- Checkboxes
- Radio controls
- Tabs
- Chips
- Cards
- List items
- Navigation bars
- Sidebars
- Modals
- Dialogs
- Drawers
- Tooltips
- Toasts
- Alerts
- Menus
- Tables
- Pagination
- Accordions
- Progress indicators
- Skeleton loaders
- Empty states
- Media cards
- Form groups

### Component rules

Every reusable component must have:

1. A resting state
2. A hover state where applicable
3. A focus state
4. An active/pressed state where applicable
5. A disabled state where applicable
6. A loading state where applicable
7. A controlled, reusable animation

Do not build static reusable components with no motion language.

### Accordion & Accordion Tree

Accordions provide progressive disclosure for layered content such as book chapter trees, question explanations, and hierarchical filters:

- **Visual Hierarchy**:
  - Parent nodes (Chapters) use prominent typography (`var(--font-title)`), a distinct badge, and sub-item count.
  - Nested children (Sections) use comfortable indentation in Arabic RTL (`padding-inline-start: 24px–36px`) and subtle supporting typography.
- **RTL Chevron Indicator**:
  - In Arabic RTL, the chevron points inward to the left (`‹`) when collapsed, and smoothly rotates 90° downward (`⌵`) when expanded.
  - Animation: `transform 200ms var(--ease-standard)`.
- **Surfaces**:
  - Rest: `transparent` or subtle `var(--surface-black)`.
  - Hover: `var(--surface-black-strong)`.
  - Active item (current reading location): `var(--surface-red)` with bright accent text.
- **Progressive Behavior**:
  - Auto-expand the branch containing the user's active reading position.
  - Quick action buttons to "توسيع الكل" (Expand All) and "طي الكل" (Collapse All).
  - Search filtering automatically reveals matching nested sections while keeping non-matching branches hidden.

### Select & Dropdown Menu

Custom reusable selectors must replace unstyled browser `<select>` elements to maintain atmospheric dark-red identity:

- **Trigger Element**:
  - Consistent with inputs: `background: rgba(0, 0, 0, 0.32)`, `border: none`, `border-radius: var(--radius-md)`.
  - Padding `var(--space-2) var(--space-4)`, min-height `44px`.
  - Trailing chevron that smoothly flips when the menu is open.
- **Floating Options Popover**:
  - `background: rgba(18, 18, 18, 0.96)`, `backdrop-filter: blur(16px)`, `border-radius: var(--radius-md)`.
  - No shadows, no bright borders.
  - Hover highlight using `var(--surface-red)`, checkmark indicator on the active choice, and full keyboard accessibility.

---

## 11. Animation System

Motion should communicate interaction and provide continuity.

### Overall animation character

Animations should feel:

- Smooth
- Relaxed
- Controlled
- Slightly soft
- Fast enough to feel responsive
- Never frantic
- Never cartoonish

### Default timing

```css
--ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
--duration-fast: 160ms;
--duration-normal: 220ms;
--duration-slow: 360ms;
```

Use the standard easing curve for most transitions.

### Reusable component animation rule

> **Every reusable component you create must have an intentional animation.**

The animation may be very subtle. It does not need to be dramatic.

Examples:

- Button: slight translate + opacity/background transition
- Card: subtle lift or content reveal, without a shadow
- Dropdown: fade + small vertical movement
- Modal: fade backdrop + scale from approximately `0.98` to `1`
- Drawer: smooth horizontal slide
- Accordion: controlled height/opacity transition
- Tab: smooth indicator movement or content fade
- Toast: fade + vertical slide
- Tooltip: fade + small translation
- Input: subtle background/opacity transition on focus
- List item: slight opacity/translation when entering
- Skeleton: restrained opacity shimmer only when genuinely useful

### Do not use

- Neon glowing animation
- Large scale bouncing
- Excessive spring motion
- Spinning elements unless functionally necessary
- Attention-seeking continuous animations
- Infinite motion for decorative purposes

---

## 12. Page-Open Animation

Every page should have a subtle page-open animation.

Recommended behavior:

1. Page content starts slightly lower and more transparent.
2. Content fades into full opacity.
3. Content moves upward a small distance.
4. Timing remains calm and short.

Example:

```css
@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-enter {
  animation: pageEnter 360ms var(--ease-standard) both;
}
```

Do not animate every child with a large stagger unless the content is specifically designed for it.

For sections where a stagger improves hierarchy, keep it subtle and short.

---

## 13. Interaction Feedback

Feedback should come primarily from:

- Opacity
- Background tone
- Small translations
- Small scale changes when appropriate
- Smooth content transitions

Do not rely on:

- Glows
- Borders appearing on hover
- Shadows
- Huge color changes
- Flashing effects

### Focus accessibility

Interactive controls must still have an obvious keyboard focus state.

Because decorative borders are forbidden, use a non-glowing focus treatment such as:

- Increased background contrast
- Slight lightness change
- An accessible focus ring only when needed for keyboard usability

Accessibility wins over purely decorative constraints.

---

## 14. Navigation

Navigation should feel calm and anchored.

### Mobile

Prefer:

- Bottom navigation where appropriate
- Compact top header
- Large enough touch targets
- Clear active-state contrast

### Desktop

Use:

- Spacious top navigation
- Side navigation when the product benefits from it
- Wider content container
- More generous section spacing

Navigation should never consume excessive screen area.

---

## 15. Forms

Forms should feel spacious and easy to scan.

### Inputs

Use transparent black or dark-red surfaces.

```css
background: rgba(0, 0, 0, 0.30);
```

No borders by default.

Use rounded corners and generous padding.

Example:

```css
min-height: 48px;
padding-inline: 14px;
border-radius: 16px;
```

Labels should remain clearly separated from inputs.

Form fields should never visually touch each other.

### Validation

Use clear text and restrained color changes.

Do not rely on a red glow, blinking border, or aggressive animation to indicate errors.

---

## 16. Cards and Lists

Cards should be used only when grouping genuinely related information.

### Card style

- Transparent black / dark-red surface
- Rounded corners
- No border
- No shadow
- Generous internal spacing
- Clear visual hierarchy
- Consistent component animation

Avoid cards inside cards unless the information hierarchy truly requires it.

### Lists

Prefer open layouts with spacing between items over heavily boxed lists.

A list item can use a slightly different transparent background on hover/active rather than a border.

---

## 17. Modals, Dialogs, Drawers

### Modal

Use:

- Transparent dark overlay
- Smooth fade
- Rounded dialog
- Dark translucent surface
- Generous padding
- Clear spacing between heading, content, and actions

Example overlay:

```css
background: rgba(0, 0, 0, 0.72);
```

Do not use glowing modal outlines or shadows.

### Drawer

Drawers should slide smoothly and remain visually separated from the background through opacity and tonal contrast, not borders or shadows.

---

## 18. Images and Media

Images should support the composition rather than overwhelm the interface.

Use:

- Rounded corners
- Black fades over images when text overlays them
- Controlled cropping
- Strong whitespace around media blocks

For image overlays, prefer:

```css
background: linear-gradient(
  to top,
  rgba(0,0,0,0.86),
  rgba(0,0,0,0.15) 60%,
  transparent
);
```

Do not use decorative image glows.

---

## 19. Icons

Icons should be simple, modern, and visually quiet.

Guidelines:

- Consistent icon family
- Avoid overly detailed icons
- Keep icon sizes proportional to nearby text
- Use opacity and color hierarchy rather than borders
- Animate interactive icons subtly

Examples:

- Menu icon rotates or transitions into close state
- Chevron rotates smoothly for expandable content
- Favorite/bookmark icon uses a restrained scale/fade transition
- Loading icon rotates only when necessary

---

## 20. Accessibility

Visual minimalism must not reduce usability.

Always maintain:

- Readable contrast
- Keyboard accessibility
- Visible focus treatment
- Adequate touch targets
- Semantic HTML
- Proper labels
- Clear error states
- Reduced-motion support

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 21. Responsive Rules

### Mobile: default

Prioritize:

- Single-column layouts
- Comfortable touch targets
- Clear spacing
- Simple navigation
- Short content groups
- Vertical rhythm

### Tablet

Introduce:

- Two-column layouts where appropriate
- Wider cards
- More compact grouping while preserving whitespace

### Desktop

Introduce:

- Multi-column dashboards
- Sidebars
- Split layouts
- Larger content widths
- More whitespace

Never simply increase the number of components until the desktop screen is filled.

Empty space is allowed and encouraged.

---

## 22. UX Density

The UI should never feel overcrowded.

When choosing between:

- More information vs. easier scanning
- More controls vs. cleaner hierarchy
- More decoration vs. stronger content

Prefer the cleaner hierarchy.

Remove secondary UI until the primary action and content are immediately understandable.

---

## 23. Common Mistakes to Avoid

### Bad

- Red neon glow around buttons
- Black cards with hard borders
- Tiny gaps between cards
- Buttons touching one another
- Content reaching the screen edge
- Bright gradients covering the entire screen
- Excessive rounded pills everywhere
- Huge animated entrances
- Random decorative floating shapes
- Desktop-first layouts squeezed into mobile
- Arabic text forced into LTR alignment
- Mixing Reem Kufi and Amiri without hierarchy

### Good

- Dark red to black atmosphere
- Transparent black surfaces
- Spacious composition
- Rounded surfaces
- Quiet interactions
- Strong Arabic typography
- Reem Kufi for major titles
- Amiri for the majority of UI content
- Subtle black fades
- No shadows
- No glow
- No decorative borders
- Calm transitions

---

## 24. Recommended Design Tokens

```css
:root {
  /* Colors */
  --color-bg-start: #3b080d;
  --color-bg-mid: #180608;
  --color-bg-end: #050505;

  --color-red: #6f1018;
  --color-red-strong: #8b1720;

  --color-surface-black: rgba(0, 0, 0, 0.28);
  --color-surface-black-strong: rgba(0, 0, 0, 0.44);
  --color-surface-red: rgba(111, 16, 24, 0.30);
  --color-surface-red-strong: rgba(111, 16, 24, 0.46);

  --color-text: rgba(255, 255, 255, 0.94);
  --color-text-secondary: rgba(255, 255, 255, 0.68);
  --color-text-muted: rgba(255, 255, 255, 0.46);

  /* Radius */
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-pill: 999px;

  /* Motion */
  --ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 160ms;
  --duration-normal: 220ms;
  --duration-slow: 360ms;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;
  --space-11: 80px;
}
```

---

## 25. Implementation Checklist

Before considering a page or component complete, verify:

### Visual

- [ ] Dark-red-to-black app background
- [ ] Dark red is the primary accent
- [ ] Transparent black/red surfaces are used appropriately
- [ ] No shadows
- [ ] No glow effects
- [ ] No unnecessary borders
- [ ] No sharp corners
- [ ] Consistent rounded corners
- [ ] Black-to-transparent fades used where useful

### Spacing

- [ ] Content does not touch the viewport edge
- [ ] Elements have clear gaps between them
- [ ] Sections have generous vertical spacing
- [ ] Controls do not visually merge together
- [ ] Layout does not feel crowded

### Typography

- [ ] UI is RTL Arabic
- [ ] Reem Kufi is used for major titles
- [ ] Amiri is used for most interface text
- [ ] Line-height is comfortable
- [ ] Hierarchy is clear

### Responsiveness

- [ ] Mobile layout was designed first
- [ ] Touch targets are comfortable
- [ ] Tablet layout expands naturally
- [ ] Desktop layout uses additional space intelligently
- [ ] No accidental overlaps

### Motion

- [ ] Page-open animation exists
- [ ] Reusable components have interaction animations
- [ ] Animations feel smooth and relaxed
- [ ] No excessive bounce or glow
- [ ] Reduced-motion behavior is supported

### UX

- [ ] Primary actions are obvious
- [ ] Secondary actions remain visually quiet
- [ ] Empty space is preserved intentionally
- [ ] Accessibility is maintained
- [ ] Components feel like one coherent design system

---

## 26. Final Design Principle

When making any design decision, prioritize this hierarchy:

**Clarity → Spacing → Typography → Color → Motion → Decoration**

The design should feel premium because it is **disciplined**, not because it is visually loud.

The final result should look like a calm, modern Arabic product built around dark red, black, transparency, rounded forms, generous spacing, and subtle motion.
