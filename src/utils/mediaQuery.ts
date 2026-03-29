/** Subscribe to prefers-reduced-motion media query changes */
export function subscribeToReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

/** Get current prefers-reduced-motion state */
export function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Server snapshot for prefers-reduced-motion */
export function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/** Subscribe to prefers-color-scheme media query changes */
export function subscribeToColorScheme(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mqlDark = window.matchMedia("(prefers-color-scheme: dark)");
  const mqlLight = window.matchMedia("(prefers-color-scheme: light)");
  mqlDark.addEventListener("change", callback);
  mqlLight.addEventListener("change", callback);
  return () => {
    mqlDark.removeEventListener("change", callback);
    mqlLight.removeEventListener("change", callback);
  };
}

/** Get current prefers-color-scheme state */
export function getColorSchemeSnapshot(): "light" | "dark" | "no-preference" {
  if (typeof window === "undefined" || !window.matchMedia)
    return "no-preference";
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  if (window.matchMedia("(prefers-color-scheme: light)").matches)
    return "light";
  return "no-preference";
}

/** Server snapshot for prefers-color-scheme */
export function getColorSchemeServerSnapshot(): "light" | "dark" | "no-preference" {
  return "no-preference";
}
