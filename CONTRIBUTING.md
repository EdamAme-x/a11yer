# Contributing to a11yer

## Setup

```bash
bun install
```

## Development

```bash
bun run dev        # watch mode
bun run test:watch # test watch mode
```

## Before submitting a PR

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

All four must pass.

## Adding a new auto-patch

1. Create `src/engine/patches/yourpatch.ts`
2. Follow the `PatchFn` signature: `(root: Element, ctx: PatchContext) => void`
3. Always check `isPatched(el, "your-key")` before modifying an element
4. Always check `isManagedByLibrary(el)` if your patch adds keyboard handlers, focus traps, or roving tabindex
5. Never overwrite existing attributes — check `el.hasAttribute()` first
6. Register in `DomScanner.ts` — choose the appropriate batch (critical sync or deferred idle)
7. Write tests next to the source: `yourpatch.test.ts`

## Patch categories

| Category | When to run |
|----------|-------------|
| **Critical** (sync) | Must be visible on first paint: html[lang], skip link, img alt, aria-required |
| **Deferred** (idle batch 1) | Forms: labels, aria-invalid, autocomplete |
| **Deferred** (idle batch 2) | Keyboard handlers, tables |
| **Deferred** (idle batch 3) | Composites, dialogs, hover content |
| **Heavy** (idle batch 4, 200ms timeout) | Contrast scanning, shadow DOM, iframes |

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add table header auto-injection (WCAG 1.3.1)
fix: aria-invalid not cleared when error element removed
```
