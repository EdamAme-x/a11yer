# Changelog

## Unreleased (2026-03-30)

### Features
- feat: initial release of a11yer

### Fixes
- fix: CI peer deps + Playwright cache

### Other
- perf: batch E2E tests — 4 parallel tests instead of 17 serial
- perf: parallelize E2E — 3 browser jobs, fullyParallel, viewport tests


## Unreleased (2026-03-30)

### Features
- feat: initial release of a11yer

### Fixes
- fix: CI peer deps + Playwright cache

### Other
- perf: parallelize E2E — 3 browser jobs, fullyParallel, viewport tests


## Unreleased (2026-03-30)

### Features
- feat: initial release of a11yer

### Fixes
- fix: CI peer deps + Playwright cache


## Unreleased (2026-03-30)

### Features
- feat: initial release of a11yer


## 0.1.0 (2026-03-30)

Initial release.

### Features

- `<A11yer>` wrapper component — wrap your app and a11y is handled automatically
- **Auto-patches (structural)**: `html[lang]` injection, skip link, `document.title` from `<h1>`
- **Auto-patches (images)**: `alt=""` on decorative images, `role="img"` on informative images, `aria-hidden` on decorative SVGs
- **Auto-patches (forms)**: `aria-required`, `aria-invalid` + `aria-describedby` error linking (with auto-cleanup), `aria-labelledby` from preceding sibling text, `autocomplete` attribute inference
- **Auto-patches (tables)**: `scope="col"` / `scope="row"` on `<th>` elements
- **Auto-patches (keyboard)**: Enter/Space handlers on non-native interactive elements (`div[role="button"]`, etc.) with role-correct behavior
- **Auto-patches (composites)**: Roving tabindex for `tablist`, `toolbar`, `radiogroup`, `menu`, `menubar`, `listbox`, `tree`
- **Auto-patches (dialogs)**: Focus trap for `[role="dialog"][aria-modal="true"]` with focus restoration on close
- **Auto-patches (hover content)**: Escape to dismiss `[role="tooltip"]`, `[popover]`, `[data-tooltip]`
- **Auto-patches (contrast)**: Detects insufficient contrast via `getComputedStyle`, auto-fixes with CSS color overrides. Supports hex, rgb, hsl, oklch, oklab. Alpha-blends semi-transparent backgrounds. Canvas fallback for `color-mix()` etc.
- **SPA route announcements**: `history.pushState`/`replaceState` interception, announces page title via `aria-live`
- **CSS injection**: `:focus-visible` outline, `prefers-reduced-motion` animation disable, `max-width: 100%` on images, skip link styles, screen-reader-only utility class
- **Library conflict avoidance**: Detects Radix UI, react-aria, Headless UI, MUI, Ark UI and skips managed elements
- **Performance**: Initial patches split into sync critical + deferred idle batches. MutationObserver coalesced at 16ms. Contrast scan capped at 100 elements per idle callback.
- **Open Shadow DOM** traversal with per-root MutationObserver
- **Same-origin iframe** scanning
- **SSR safe**: All DOM access in `useEffect`. `"use client"` directive for Next.js App Router.