import type { PatchContext } from "../../types";
import { isPatched, markPatched } from "../../utils/dom";

/**
 * Selectors for elements that show additional content on hover/focus
 * (tooltips, popovers). Non-modal dialogs are NOT included —
 * they are persistent content, not hover/focus triggered.
 */
const HOVER_CONTENT_SELECTORS = [
  '[role="tooltip"]',
  "[data-tooltip]",
  "[popover]",
];

/**
 * WCAG 1.4.13: Content shown on hover or focus must be dismissible.
 * Auto-inject Escape key handler to dismiss tooltip/popover content.
 * Uses visibility:hidden instead of display:none to avoid layout shifts
 * and conflicts with CSS-class-controlled visibility.
 */
export function patchHoverContent(
  root: Element,
  _ctx: PatchContext,
): void {
  if (typeof document === "undefined") return;

  const elements = root.querySelectorAll<HTMLElement>(
    HOVER_CONTENT_SELECTORS.join(","),
  );

  for (const el of elements) {
    if (isPatched(el, "hover-dismiss")) continue;

    // Find the trigger element (the thing that shows this tooltip)
    const id = el.id;
    const trigger = id
      ? root.querySelector(
          `[aria-describedby~="${id}"], [aria-controls="${id}"]`,
        )
      : null;

    const dismiss = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      if (el.hasAttribute("popover") && "hidePopover" in el && typeof el.hidePopover === "function") {
        el.hidePopover();
      } else {
        // Use visibility instead of display to avoid layout conflicts
        el.style.visibility = "hidden";
        // Restore on next hover/focus cycle
        const restore = () => {
          el.style.visibility = "";
        };
        // Listen on the trigger, not the element itself (it's now hidden)
        if (trigger) {
          trigger.addEventListener("mouseenter", restore, { once: true });
          trigger.addEventListener("focusin", restore, { once: true });
        } else {
          // No trigger found — restore on any pointer/focus entering the area
          el.addEventListener("mouseenter", restore, { once: true });
        }
      }
    };

    // Attach to the tooltip element
    el.addEventListener("keydown", dismiss);
    // Also attach to the trigger so Escape works when trigger is focused
    if (trigger) {
      trigger.addEventListener("keydown", dismiss as EventListener);
    }

    markPatched(el, "hover-dismiss");
  }
}
