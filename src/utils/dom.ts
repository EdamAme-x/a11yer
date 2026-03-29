const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "radio",
  "switch",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "tab",
  "treeitem",
  "slider",
  "spinbutton",
  "combobox",
  "searchbox",
  "textbox",
  "scrollbar",
]);

/** Check if an element already has an accessible name */
export function isAlreadyLabelled(el: Element): boolean {
  if (el.hasAttribute("aria-label")) return true;
  if (el.hasAttribute("aria-labelledby")) return true;
  if (el.hasAttribute("title")) return true;

  // Check for associated <label>
  if (el.id) {
    const label = el.ownerDocument?.querySelector(`label[for="${el.id}"]`);
    if (label) return true;
  }

  // Check for wrapping <label>
  if (el.closest("label")) return true;

  return false;
}

/** Check if an element is interactive */
export function isInteractive(el: Element): boolean {
  const tagName = el.tagName.toLowerCase();
  if (tagName === "a" && el.hasAttribute("href")) return true;
  if (tagName === "button") return true;
  if (tagName === "input" && el.getAttribute("type") !== "hidden") return true;
  if (tagName === "select" || tagName === "textarea") return true;

  const role = el.getAttribute("role");
  if (role && INTERACTIVE_ROLES.has(role)) return true;

  const tabindex = el.getAttribute("tabindex");
  if (tabindex !== null && tabindex !== "-1") return true;

  return false;
}

/** Deep text content extraction, excluding aria-hidden elements */
export function getTextContent(el: Element): string {
  if (el.getAttribute("aria-hidden") === "true") return "";

  let text = "";
  for (const child of el.childNodes) {
    if (child.nodeType === 3 /* TEXT */) {
      text += child.textContent || "";
    } else if (child.nodeType === 1 /* ELEMENT */) {
      text += getTextContent(child as Element);
    }
  }
  return text.trim();
}

/** Check if an element has an explicit role attribute */
export function hasExplicitRole(el: Element): boolean {
  return el.hasAttribute("role");
}

/** Mark an element as patched by a specific key */
export function markPatched(el: Element, key: string): void {
  el.setAttribute(`data-a11yer-${key}`, "");
}

/** Check if an element has been patched by a specific key */
export function isPatched(el: Element, key: string): boolean {
  return el.hasAttribute(`data-a11yer-${key}`);
}

/** Check if an element is visible (not display:none, hidden, etc.) */
export function isVisible(el: Element): boolean {
  if (el.hasAttribute("hidden")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;

  const htmlEl = el as HTMLElement;
  if (htmlEl.offsetParent === null && htmlEl.style?.display !== "fixed") {
    // offsetParent is null for display:none, but also for position:fixed
    // Double check: if it has no dimensions, it's hidden
    if (htmlEl.offsetWidth === 0 && htmlEl.offsetHeight === 0) return false;
  }

  return true;
}

/** Get all focusable elements within a container */
export function getFocusableElements(container: Element): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(elements).filter(
    (el) => !el.hasAttribute("disabled") && isVisible(el),
  );
}

/**
 * Check if an element is managed by an existing a11y library
 * (Radix UI, react-aria, Headless UI, MUI, etc.)
 * These libraries manage their own ARIA attributes, focus traps,
 * and keyboard handlers — patching on top would break them.
 */
export function isManagedByLibrary(el: Element): boolean {
  // Radix UI: data-radix-*, data-state
  if (el.hasAttribute("data-radix-collection-item")) return true;
  if (el.hasAttribute("data-radix-focus-guard")) return true;
  if (
    el.hasAttribute("data-state") &&
    (el.hasAttribute("data-radix-menu-content") ||
      el.closest("[data-radix-popper-content-wrapper]") ||
      el.closest("[data-radix-dialog-content]") ||
      el.closest("[data-radix-popover-content]"))
  )
    return true;

  // react-aria: data-rac-*, data-react-aria-*
  for (const attr of el.attributes) {
    if (attr.name.startsWith("data-rac")) return true;
    if (attr.name.startsWith("data-react-aria")) return true;
  }

  // Headless UI: data-headlessui-state, data-headlessui
  if (el.hasAttribute("data-headlessui-state")) return true;
  if (el.hasAttribute("data-headlessui")) return true;

  // MUI: class names starting with Mui, data-testid with Mui prefix
  const className = el.getAttribute("class") || "";
  if (/\bMui[A-Z]/.test(className)) return true;

  // Ark UI / Zag: data-scope, data-part
  if (el.hasAttribute("data-scope") && el.hasAttribute("data-part"))
    return true;

  // Check if a React-managed library has attached internal fiber props
  // indicating it handles its own keyboard events
  const hasInternalHandler = Object.keys(el).some(
    (k) =>
      k.startsWith("__reactFiber") || k.startsWith("__reactInternals"),
  );
  if (hasInternalHandler) {
    try {
      const fiberKey = Object.keys(el).find(
        (k) =>
          k.startsWith("__reactFiber") || k.startsWith("__reactInternals"),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fiber = fiberKey ? (el as any)[fiberKey] : null;
      const props = fiber?.memoizedProps;
      // If the component already has onKeyDown, it manages its own keyboard
      if (props?.onKeyDown && el.getAttribute("role")) return true;
    } catch {
      // Ignore fiber inspection failures
    }
  }

  return false;
}

/** Generate a unique ID for an element if it doesn't have one */
export function ensureId(el: Element, prefix: string): string {
  if (el.id) return el.id;
  const id = `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  el.id = id;
  return id;
}
