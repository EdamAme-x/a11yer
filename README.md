# a11yer

[![npm](https://img.shields.io/npm/v/a11yer)](https://www.npmjs.com/package/a11yer)
[![CI](https://github.com/EdamAme-x/a11yer/actions/workflows/ci.yml/badge.svg)](https://github.com/EdamAme-x/a11yer/actions/workflows/ci.yml)
[![E2E](https://github.com/EdamAme-x/a11yer/actions/workflows/e2e.yml/badge.svg)](https://github.com/EdamAme-x/a11yer/actions/workflows/e2e.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Wrap your React app in `<A11yer>` and accessibility is automatically handled.

No hooks to call. No props to spread. No components to replace. Just wrap and ship.

## Install

```bash
bun add a11yer
# or
npm install a11yer
```

## Usage

```tsx
import { A11yer } from "a11yer";

function App() {
  return (
    <A11yer>
      <YourApp />
    </A11yer>
  );
}
```

That's it.

## What it does

a11yer silently scans and patches your DOM for accessibility issues:

| Category | What gets fixed |
|----------|----------------|
| **Structure** | `html[lang]` injection, skip link, `document.title` from `<h1>` |
| **Images** | `alt=""` on decorative images, `role="img"` on informative images in links, `aria-hidden` on decorative SVGs |
| **Forms** | `aria-required`, `aria-invalid` + `aria-describedby` error linking, input label linking, `autocomplete` inference |
| **Tables** | `scope="col"` / `scope="row"` on `<th>` |
| **Keyboard** | Enter/Space on `div[role="button"]` etc., `tabindex="0"` |
| **Composites** | Roving tabindex for tablist, toolbar, radiogroup, menu, listbox, tree |
| **Dialogs** | Auto focus trap + focus restoration for `[role="dialog"][aria-modal="true"]` |
| **Tooltips** | Escape to dismiss `[role="tooltip"]`, `[popover]` |
| **Contrast** | Auto-fix via CSS color override (hex, rgb, hsl, oklch, oklab) |
| **Motion** | `prefers-reduced-motion` CSS injection |
| **Focus** | `:focus-visible` outline |
| **SPA** | Route change announcements via `aria-live` |

## Config

All features are enabled by default. Override via the `config` prop:

```tsx
<A11yer
  config={{
    a11y: {
      minContrastRatio: 7,        // WCAG AAA (default: 4.5 for AA)
      focusVisible: true,          // default: true
      focusStyle: {                // default: 2px solid currentColor
        outline: "3px solid blue",
        outlineOffset: "2px",
      },
      reducedMotion: "auto",       // "auto" | "always" | "never"
      autoImgAlt: true,            // default: true
      announceSpaNavigation: true, // default: true
      autoContrastFix: true,       // default: true
    },
  }}
>
  <App />
</A11yer>
```

## How it works

1. On mount, critical patches run synchronously (html[lang], skip link, img alt, aria-required)
2. Remaining patches are split across `requestIdleCallback` batches to avoid blocking the main thread
3. A `MutationObserver` watches for DOM changes and re-patches affected subtrees
4. Open Shadow DOM roots and same-origin iframes are recursively scanned
5. Contrast fixes use `getComputedStyle` + alpha blending + canvas fallback for exotic color formats

## Plays nice with others

a11yer detects elements managed by existing a11y libraries and skips them:

- Radix UI
- react-aria (Adobe)
- Headless UI (Tailwind)
- MUI (Material UI)
- Ark UI / Zag

No double-injection. No conflicts.

## Frameworks

| Framework | Status |
|-----------|--------|
| Next.js App Router | `"use client"` included. Works out of the box. |
| Next.js Pages Router | Works. |
| Remix | Works. SSR-safe. |
| Vite + React | Works. |

## Browser support

Tested on every push via Playwright E2E + axe-core in CI (3 parallel jobs):

| Engine | Viewports tested |
|--------|-----------------|
| Chromium (Chrome) | Desktop 1280px, Tablet 768px, Mobile 375px |
| Firefox | Desktop 1280px, Tablet 768px, Mobile 375px |
| WebKit (Safari) | Desktop 1280px, Tablet 768px, Mobile 375px |

## Testing

```bash
bun run test          # Unit tests (Vitest + happy-dom, 190+ tests)
bun run test:e2e      # E2E tests (Playwright, all browsers — run in CI, see below)
```

E2E tests run in GitHub Actions, not locally. To run locally via Docker:

```bash
docker build -t a11yer-test .
```

## API

```ts
// That's the entire public API
export { A11yer } from "a11yer";
export type { A11yerProps, A11yerConfig } from "a11yer";
```

## Disclaimer

a11yer automatically fixes many common accessibility issues, but it does not guarantee full WCAG 2.2 compliance. Automated tools can address approximately 30-40% of WCAG success criteria. The remaining criteria require human judgment, manual testing with assistive technology, and content-level decisions (meaningful alt text, logical heading structure, comprehensible error messages, etc.).

**Do not rely on a11yer as your sole accessibility solution.** Use it as a safety net alongside manual a11y audits, screen reader testing, and accessibility-focused design practices.

## License

MIT
