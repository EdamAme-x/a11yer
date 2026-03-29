/** Focus indicator style configuration */
export interface FocusStyleConfig {
  outline: string;
  outlineOffset: string;
}

/** User-facing accessibility configuration */
export interface A11yConfig {
  /** Minimum contrast ratio for auto-fix (WCAG AA = 4.5, AAA = 7) */
  minContrastRatio: number;
  /** Inject :focus-visible styles */
  focusVisible: boolean;
  /** Focus indicator style */
  focusStyle: FocusStyleConfig;
  /** Respect prefers-reduced-motion: 'auto' reads from browser */
  reducedMotion: "auto" | "always" | "never";
  /** Auto-inject alt="" on images missing alt */
  autoImgAlt: boolean;
  /** Announce SPA route changes via live region */
  announceSpaNavigation: boolean;
  /** Auto-fix contrast violations by overriding text color */
  autoContrastFix: boolean;
}

/** Configuration prop for the A11yer component */
export interface A11yerConfig {
  a11y?: Partial<A11yConfig>;
}

/** Internal patch context */
export interface PatchContext {
  config: A11yConfig;
}

export const defaultFocusStyle: FocusStyleConfig = {
  outline: "2px solid currentColor",
  outlineOffset: "2px",
};

export const defaultA11yConfig: A11yConfig = {
  minContrastRatio: 4.5,
  focusVisible: true,
  focusStyle: defaultFocusStyle,
  reducedMotion: "auto",
  autoImgAlt: true,
  announceSpaNavigation: true,
  autoContrastFix: true,
};
