const SR_ONLY_STYLES =
  "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";

let politeRegion: HTMLDivElement | null = null;
let assertiveRegion: HTMLDivElement | null = null;
let mounted = false;

function createRegion(
  priority: "polite" | "assertive",
): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("aria-live", priority);
  el.setAttribute("aria-atomic", "true");
  el.setAttribute("role", priority === "assertive" ? "alert" : "status");
  el.setAttribute("data-a11yer-announcer", priority);
  el.style.cssText = SR_ONLY_STYLES;
  return el;
}

/** Mount live regions into the DOM. Returns cleanup function. */
export function mountAnnouncer(): () => void {
  if (typeof document === "undefined") return () => {};
  if (mounted) return () => unmountAnnouncer();

  politeRegion = createRegion("polite");
  assertiveRegion = createRegion("assertive");
  document.body.appendChild(politeRegion);
  document.body.appendChild(assertiveRegion);
  mounted = true;

  return unmountAnnouncer;
}

/** Remove live regions from the DOM. */
export function unmountAnnouncer(): void {
  if (!mounted) return;
  politeRegion?.remove();
  assertiveRegion?.remove();
  politeRegion = null;
  assertiveRegion = null;
  mounted = false;
}

/**
 * Announce a message to screen readers.
 * Uses the "clear then set" trick to force re-announcement.
 */
export function announce(
  message: string,
  priority: "polite" | "assertive" = "polite",
): void {
  if (typeof document === "undefined") return;

  // Auto-mount if not mounted
  if (!mounted) mountAnnouncer();

  const region = priority === "assertive" ? assertiveRegion : politeRegion;
  if (!region) return;

  // Clear then set to force re-announcement even for identical messages
  region.textContent = "";
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}

/** Check if the announcer is currently mounted */
export function isAnnouncerMounted(): boolean {
  return mounted;
}
