import type { PatchContext } from "../../types";
import { isManagedByLibrary, isPatched, markPatched } from "../../utils/dom";

const keyboardHandlers = new WeakMap<Element, (e: KeyboardEvent) => void>();

/**
 * Non-native elements with interactive roles that need Enter/Space handlers.
 * Excludes tab/menuitem/option — these are handled by composites.ts.
 */
const NEEDS_KEYBOARD = [
  '[role="button"]:not(button)',
  '[role="link"]:not(a)',
  '[role="checkbox"]:not(input)',
  '[role="radio"]:not(input)',
  '[role="switch"]:not(input)',
];

/**
 * Roles where Space should toggle state, not just click.
 */
const TOGGLE_ROLES = new Set(["checkbox", "radio", "switch"]);

/**
 * Auto-inject keyboard handlers on non-native interactive elements.
 * - button/link: Enter + Space → click
 * - checkbox/radio/switch: Space → click (Enter does nothing per spec)
 * Skips elements managed by existing a11y libraries.
 */
export function patchKeyboardHandlers(
  root: Element,
  _ctx: PatchContext,
): void {
  if (typeof document === "undefined") return;

  const elements = root.querySelectorAll<HTMLElement>(
    NEEDS_KEYBOARD.join(","),
  );

  for (const el of elements) {
    if (isPatched(el, "keyboard")) continue;
    if (isManagedByLibrary(el)) {
      markPatched(el, "keyboard");
      continue;
    }

    // Ensure focusable
    if (!el.hasAttribute("tabindex")) {
      el.setAttribute("tabindex", "0");
    }

    const role = el.getAttribute("role") || "";
    const isToggle = TOGGLE_ROLES.has(role);

    const handler = (e: KeyboardEvent) => {
      if (isToggle) {
        // Toggle roles: only Space activates (per ARIA APG)
        if (e.key === " ") {
          e.preventDefault();
          el.click();
        }
      } else {
        // Button/link roles: Enter and Space both activate
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          el.click();
        }
      }
    };

    el.addEventListener("keydown", handler);
    keyboardHandlers.set(el, handler);
    markPatched(el, "keyboard");
  }
}

/**
 * Clean up keyboard handlers for removed elements.
 */
export function cleanKeyboardHandlers(root: Element): void {
  const patched = root.querySelectorAll("[data-a11yer-keyboard]");
  for (const el of patched) {
    if (!el.isConnected) {
      const handler = keyboardHandlers.get(el);
      if (handler) {
        el.removeEventListener("keydown", handler as EventListener);
        keyboardHandlers.delete(el);
      }
    }
  }
}
