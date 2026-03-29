import type { PatchContext } from "../../types";
import { ensureId, isAlreadyLabelled, isPatched, markPatched } from "../../utils/dom";

/** Inject aria-required on required inputs */
export function patchAriaRequired(root: Element, _ctx: PatchContext): void {
  const inputs = root.querySelectorAll(
    "input[required]:not([aria-required]), select[required]:not([aria-required]), textarea[required]:not([aria-required])",
  );

  for (const input of inputs) {
    if (isPatched(input, "required")) continue;
    input.setAttribute("aria-required", "true");
    markPatched(input, "required");
  }
}

/**
 * Detect error messages adjacent to inputs and link them via
 * aria-invalid + aria-describedby. Also cleans up when errors disappear.
 */
export function patchAriaInvalid(root: Element, _ctx: PatchContext): void {
  const errorIndicators = root.querySelectorAll(
    '[role="alert"], .error, .invalid, .field-error, .validation-error, [data-error]',
  );

  for (const errorEl of errorIndicators) {
    if (isPatched(errorEl, "error-link")) continue;

    const parent = errorEl.parentElement;
    if (!parent) continue;

    const input = parent.querySelector(
      "input, select, textarea",
    ) as HTMLElement | null;
    if (!input) continue;
    // Skip if aria-invalid is already set (true OR false — respect developer intent)
    if (input.hasAttribute("aria-invalid")) continue;

    const errorId = ensureId(errorEl, "a11yer-error");

    input.setAttribute("aria-invalid", "true");
    input.setAttribute("data-a11yer-error-source", errorId);
    const existing = input.getAttribute("aria-describedby");
    input.setAttribute(
      "aria-describedby",
      existing ? `${existing} ${errorId}` : errorId,
    );

    markPatched(errorEl, "error-link");
  }
}

/**
 * Clean up aria-invalid when the associated error element
 * has been removed from the DOM.
 */
export function cleanAriaInvalid(root: Element): void {
  const invalidInputs = root.querySelectorAll("[data-a11yer-error-source]");

  for (const input of invalidInputs) {
    const errorId = input.getAttribute("data-a11yer-error-source");
    if (!errorId) continue;

    // Check if the error element still exists
    const errorEl = root.ownerDocument?.getElementById(errorId);
    if (errorEl) continue;

    // Error element removed — clean up
    input.removeAttribute("aria-invalid");
    input.removeAttribute("data-a11yer-error-source");

    const describedBy = input.getAttribute("aria-describedby");
    if (describedBy) {
      const remaining = describedBy
        .split(" ")
        .filter((id) => id !== errorId)
        .join(" ");
      if (remaining) {
        input.setAttribute("aria-describedby", remaining);
      } else {
        input.removeAttribute("aria-describedby");
      }
    }
  }
}

/**
 * For inputs without any label, attempt to find a preceding sibling
 * text element and link via aria-labelledby.
 */
export function patchInputLabels(root: Element, _ctx: PatchContext): void {
  const inputs = root.querySelectorAll(
    "input:not([type='hidden']):not([type='submit']):not([type='reset']):not([type='button']), select, textarea",
  );

  for (const input of inputs) {
    if (isPatched(input, "label")) continue;
    if (isAlreadyLabelled(input)) continue;

    // Look for preceding sibling text that could be a label
    const prev = input.previousElementSibling;
    if (
      prev &&
      (prev.tagName === "SPAN" || prev.tagName === "P" || prev.tagName === "DIV") &&
      prev.textContent?.trim()
    ) {
      const labelId = ensureId(prev, "a11yer-label");
      input.setAttribute("aria-labelledby", labelId);
      markPatched(input, "label");
    }
    // If no candidate found, leave it alone — can't safely auto-fix
  }
}
