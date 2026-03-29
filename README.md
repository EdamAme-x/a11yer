# a11yer

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

Tested on every push via Playwright E2E + axe-core in CI:

| Browser | Device |
|---------|--------|
| Chrome | Desktop |
| Firefox | Desktop |
| Safari (WebKit) | Desktop |
| Chrome | Pixel 7 (mobile) |
| Safari (WebKit) | iPhone 15 (mobile) |
| Safari (WebKit) | iPad (tablet) |

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

## License

MIT
