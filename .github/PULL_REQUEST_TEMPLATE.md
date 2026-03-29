## Summary

<!-- What does this PR do? -->

## WCAG Coverage

<!-- Which WCAG success criteria does this affect? (e.g., 1.4.3 Contrast Minimum) -->

## Checklist

- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run test` passes (190+ tests)
- [ ] `bun run build` succeeds
- [ ] New patches have tests
- [ ] New patches check `isPatched()` to prevent double-patching
- [ ] New patches check `isManagedByLibrary()` where applicable
- [ ] New patches never overwrite existing attributes (`el.hasAttribute()` guard)
