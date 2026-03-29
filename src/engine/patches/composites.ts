import type { PatchContext } from "../../types";
import { isManagedByLibrary, isPatched, markPatched } from "../../utils/dom";

const COMPOSITE_SELECTORS = [
  '[role="tablist"]',
  '[role="toolbar"]',
  '[role="radiogroup"]',
  '[role="menu"]',
  '[role="menubar"]',
  '[role="listbox"]',
  '[role="tree"]',
];

const CHILD_ROLE_MAP: Record<string, string[]> = {
  tablist: ["tab"],
  toolbar: ["button"],
  radiogroup: ["radio"],
  menu: ["menuitem", "menuitemcheckbox", "menuitemradio"],
  menubar: ["menuitem", "menuitemcheckbox", "menuitemradio"],
  listbox: ["option"],
  tree: ["treeitem"],
};

const activeHandlers = new WeakMap<Element, (e: KeyboardEvent) => void>();

/**
 * Get direct child items of a composite widget.
 * Only selects children whose closest composite ancestor IS this container,
 * preventing nested composite children from being included.
 */
function getChildItems(
  container: Element,
  containerRole: string,
): HTMLElement[] {
  const childRoles = CHILD_ROLE_MAP[containerRole];
  if (!childRoles) return [];

  const selector = childRoles.map((r) => `[role="${r}"]`).join(",");
  const all = container.querySelectorAll<HTMLElement>(selector);
  const items: HTMLElement[] = [];

  for (const el of all) {
    if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") continue;
    // Ensure this item's closest composite parent is THIS container,
    // not a nested sub-menu/sub-list
    const closestComposite = el.parentElement?.closest(
      COMPOSITE_SELECTORS.join(","),
    );
    if (closestComposite === container) {
      items.push(el);
    }
  }

  // For toolbar, also include native buttons that are direct children
  if (containerRole === "toolbar") {
    const buttons = container.querySelectorAll<HTMLElement>(
      "button:not([disabled])",
    );
    for (const btn of buttons) {
      const closestComposite = btn.parentElement?.closest(
        COMPOSITE_SELECTORS.join(","),
      );
      if (closestComposite === container && !items.includes(btn)) {
        items.push(btn);
      }
    }
  }

  return items;
}

function isHorizontal(container: Element): boolean {
  const orientation = container.getAttribute("aria-orientation");
  if (orientation === "vertical") return false;
  if (orientation === "horizontal") return true;
  const role = container.getAttribute("role") || "";
  return ["tablist", "toolbar", "menubar"].includes(role);
}

function setupRovingTabindex(container: Element): void {
  const role = container.getAttribute("role") || "";
  const items = getChildItems(container, role);
  if (items.length === 0) return;

  // Set initial tabindex: selected/checked item gets 0, rest -1
  let activeIndex = 0;
  for (let i = 0; i < items.length; i++) {
    if (
      items[i].getAttribute("aria-selected") === "true" ||
      items[i].getAttribute("aria-checked") === "true"
    ) {
      activeIndex = i;
      break;
    }
  }

  for (let i = 0; i < items.length; i++) {
    items[i].setAttribute("tabindex", i === activeIndex ? "0" : "-1");
  }

  const horizontal = isHorizontal(container);
  const nextKey = horizontal ? "ArrowRight" : "ArrowDown";
  const prevKey = horizontal ? "ArrowLeft" : "ArrowUp";

  const handler = (e: KeyboardEvent) => {
    const currentItems = getChildItems(container, role);
    if (currentItems.length === 0) return;

    const currentIndex = currentItems.findIndex(
      (el) => el === document.activeElement,
    );
    if (currentIndex === -1) return;

    let next: number;

    switch (e.key) {
      case nextKey:
        next = (currentIndex + 1) % currentItems.length;
        break;
      case prevKey:
        next =
          (currentIndex - 1 + currentItems.length) % currentItems.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = currentItems.length - 1;
        break;
      case "Escape":
        // For menu/menubar, Escape closes and returns focus
        if (["menu", "menubar"].includes(role)) {
          const trigger = container.ownerDocument?.querySelector(
            `[aria-controls="${container.id}"]`,
          );
          if (trigger) (trigger as HTMLElement).focus();
        }
        return;
      default:
        return;
    }

    e.preventDefault();
    currentItems[currentIndex].setAttribute("tabindex", "-1");
    currentItems[next].setAttribute("tabindex", "0");
    currentItems[next].focus();
  };

  container.addEventListener("keydown", handler as EventListener);
  activeHandlers.set(container, handler);
}

/**
 * Auto-apply roving tabindex to composite widgets.
 * Skips elements managed by existing a11y libraries.
 */
export function patchCompositeWidgets(
  root: Element,
  _ctx: PatchContext,
): void {
  if (typeof document === "undefined") return;

  const composites = root.querySelectorAll(COMPOSITE_SELECTORS.join(","));

  for (const container of composites) {
    if (isPatched(container, "roving")) continue;
    if (isManagedByLibrary(container)) {
      markPatched(container, "roving");
      continue;
    }
    setupRovingTabindex(container);
    markPatched(container, "roving");
  }
}

/**
 * Clean up handlers for removed composite widgets.
 */
export function cleanCompositeWidgets(root: Element): void {
  const patched = root.querySelectorAll("[data-a11yer-roving]");
  for (const container of patched) {
    if (!container.isConnected) {
      const handler = activeHandlers.get(container);
      if (handler) {
        container.removeEventListener("keydown", handler as EventListener);
        activeHandlers.delete(container);
      }
    }
  }
}
