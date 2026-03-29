import type { FocusStyleConfig } from "../types";

export interface StyleInjectorOptions {
  focusVisible: boolean;
  focusStyle: FocusStyleConfig;
  reducedMotion: boolean;
}

const STYLE_ID = "a11yer-styles";

function buildCSS(options: StyleInjectorOptions): string {
  const sections: string[] = [];

  // Visually hidden utility class (used by skip link + announcer)
  sections.push(`.a11yer-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}`);

  // Skip link
  sections.push(`.a11yer-skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  z-index: 999999;
  padding: 8px 16px;
  background: #000;
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  font-size: 14px;
}
.a11yer-skip-link:focus {
  left: 8px;
  top: 8px;
}`);

  // Focus-visible styles
  if (options.focusVisible) {
    sections.push(`:focus-visible {
  outline: ${options.focusStyle.outline};
  outline-offset: ${options.focusStyle.outlineOffset};
}`);
  }

  // Reduced motion
  if (options.reducedMotion) {
    sections.push(`@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`);
  }

  // Responsive images (max-width only, no height override)
  sections.push(`img, svg { max-width: 100%; }`);

  return sections.join("\n\n");
}

export class StyleInjector {
  private styleEl: HTMLStyleElement | null = null;

  inject(options: StyleInjectorOptions): void {
    if (typeof document === "undefined") return;

    const css = buildCSS(options);

    if (!this.styleEl) {
      const existing = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
      if (existing) {
        this.styleEl = existing;
      } else {
        this.styleEl = document.createElement("style");
        this.styleEl.id = STYLE_ID;
        this.styleEl.setAttribute("data-a11yer", "styles");
        document.head.appendChild(this.styleEl);
      }
    }

    this.styleEl.textContent = css;
  }

  remove(): void {
    if (typeof document === "undefined") return;
    this.styleEl?.remove();
    this.styleEl = null;
    document.getElementById("a11yer-contrast-fixes")?.remove();
  }
}
