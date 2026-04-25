# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Brand

**Unmapped** — Brand name must appear consistently across all pages. Footer copyright: "© 2026 UNMAPPED". Page titles prefixed with "Unmapped".

## Tech Stack

- **Frontend**: React 19 + TypeScript (in `frontend/` directory)
- **Build Tool**: Vite 8
- **Styling**: TailwindCSS v4 (CSS-first config via `@theme` in `src/index.css` — NO `tailwind.config.ts`)
- **Routing**: React Router v7 (declarative SPA mode, lazy-loaded pages)
- **Fonts**: Poppins (Google Fonts), Material Symbols Outlined (icons)
- **Dark Mode**: Class-based via `.dark` on `<html>`

## Commands

```bash
cd frontend
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
```

## Project Structure

```
frontend/
  src/
    components/          # Shared reusable components
      AuthLayout.tsx     # Centered auth page wrapper (max-w-sm, title, footer)
      Button.tsx         # Primary action button (full-width, uppercase label-sm)
      Footer.tsx         # Fixed bottom bar (copyright + Terms/Privacy/Help)
      InputField.tsx     # Underline-only input with uppercase label
    pages/               # Route-level page components (lazy-loaded)
      Login.tsx          # / — email + password form
      Register.tsx       # /register — name + email + password + confirm
    index.css            # TailwindCSS v4 theme — ALL design tokens live here
    main.tsx             # Entry point, router, Suspense boundary
```

## Design System

**All design tokens are defined in `frontend/src/index.css` using TailwindCSS v4 `@theme` directives. Every page MUST use these exact tokens — same colors, same typography, same spacing, same component patterns. No exceptions.**

### Colors (Material Design 3 Light Scheme)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | #000000 | Buttons, focus borders, active states |
| `on-primary` | #ffffff | Text on primary backgrounds |
| `secondary` | #5e5e5e | Secondary elements |
| `on-secondary` | #ffffff | Text on secondary backgrounds |
| `background` | #f9f9f9 | Page background |
| `surface` | #f9f9f9 | Card/panel backgrounds |
| `on-surface` | #1a1c1c | Primary text |
| `on-surface-variant` | #444748 | Secondary text, labels |
| `outline` | #747878 | Borders, dividers |
| `outline-variant` | #c4c7c7 | Subtle borders, input underlines |
| `error` | #ba1a1a | Error states |

Full token list: primary-container, primary-fixed, primary-fixed-dim, secondary-container, secondary-fixed, tertiary variants, surface-container variants (lowest/low/high/highest), surface-dim, surface-bright, surface-tint, inverse-surface, inverse-on-surface, inverse-primary, error-container, on-error, on-error-container — all defined in `index.css`.

### Typography

All text uses **Poppins** font. Use `font-poppins` utility class.

| Token | Size | Line Height | Letter Spacing | Weight | Usage |
|-------|------|-------------|----------------|--------|-------|
| `display` | 48px | 1.1 | -0.02em | 500 | Hero headings |
| `h1` | 32px | 1.2 | -0.015em | 500 | Page titles |
| `h2` | 24px | 1.3 | -0.01em | 500 | Section headings |
| `body-lg` | 18px | 1.6 | 0 | 400 | Large body text |
| `body-md` | 16px | 1.6 | 0 | 400 | Default body text |
| `label-sm` | 12px | 1 | 0.05em | 600 | Labels, buttons, captions |

Usage: `text-h1` applies size + line-height + letter-spacing + font-weight automatically.

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `unit` | 8px | Base spacing unit — `gap-unit`, `p-unit` |
| `margin-page` | 64px | Page horizontal margins |
| `gutter` | 32px | Content gutter |
| `section-gap` | 128px | Between page sections |
| `container-max` | 1200px | Max content width |

### Border Radius

| Token | Value |
|-------|-------|
| `default` | 0.125rem |
| `lg` | 0.25rem |
| `xl` | 0.5rem |
| `full` | 0.75rem |

### Component Patterns

These patterns are shared across all pages and MUST be followed:

- **Input fields**: Transparent background, bottom border only (`border-b border-outline-variant`), no focus ring (`focus:ring-0 focus:outline-none`), focus changes border to primary (`focus:border-primary`), 300ms transition
- **Labels**: `font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider`
- **Buttons**: `bg-primary text-on-primary py-4 rounded-default text-label-sm uppercase tracking-wider hover:opacity-80`
- **Auth pages**: Use `AuthLayout` component — centered `max-w-sm` wrapper with title + footer
- **Transitions**: Always `duration-300` for consistency
- **Responsive padding**: `px-6 sm:px-8` on main content areas

### Routing

Defined in `frontend/src/main.tsx`. All pages loaded via `React.lazy()` with `Suspense`.

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Login | Login form (default) |
| `/register` | Register | Registration form |

## Strict Design Consistency Rule

**Every new page or component MUST adhere to this exact design system.** Same color tokens, same typography scale, same spacing values, same input/button styles, same transition durations. Do not introduce new colors, fonts, or spacing values outside of what is defined in `frontend/src/index.css`. If a new token is needed, add it to the `@theme` block in `index.css` first, then use it everywhere.
