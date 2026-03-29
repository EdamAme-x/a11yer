import type { PatchContext } from "../../types";
import { getFocusableElements, isManagedByLibrary, isPatched, markPatched } from "../../utils/dom";

const activeTraps = new WeakMap<HTMLElement, { cleanup: () => void; trigger: Element | null }>();

function activateFocusTrap(dialog: HTMLElement): void {
  if (activeTraps.has(dialog)) return;

  // Save the element that had focus before the dialog opened
  const trigger = document.activeElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Escape closes the dialog (for div-based modals, not native <dialog>)
    if (e.key === "Escape" && dialog.tagName !== "DIALOG") {
      e.preventDefault();
      deactivateFocusTrap(dialog);
      dialog.setAttribute("aria-hidden", "true");
      return;
    }

    if (e.key !== "Tab") return;

    const focusable = getFocusableElements(dialog);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  dialog.addEventListener("keydown", handleKeyDown);
  activeTraps.set(dialog, {
    cleanup: () => dialog.removeEventListener("keydown", handleKeyDown),
    trigger: trigger,
  });

  // Focus first focusable element in the dialog
  const focusable = getFocusableElements(dialog);
  if (focusable.length > 0) {
    focusable[0].focus();
  }
}

function deactivateFocusTrap(dialog: HTMLElement): void {
  const trap = activeTraps.get(dialog);
  if (trap) {
    trap.cleanup();
    // Restore focus to the element that triggered the dialog
    if (trap.trigger && "focus" in trap.trigger) {
      (trap.trigger as HTMLElement).focus();
    }
    activeTraps.delete(dialog);
  }
}

/**
 * Auto-apply focus trapping to open modal dialogs.
 * Skips native <dialog> elements (browser handles focus trap natively)
 * and elements managed by existing a11y libraries.
 */
export function patchDialogFocusTrap(
  root: Element,
  _ctx: PatchContext,
): void {
  if (typeof document === "undefined") return;

  // Only target div-based modals, NOT native <dialog> (which has built-in trap)
  const dialogs = root.querySelectorAll<HTMLElement>(
    '[role="dialog"][aria-modal="true"]:not([aria-hidden="true"]):not(dialog)',
  );

  for (const dialog of dialogs) {
    if (isPatched(dialog, "focus-trap")) continue;
    // Skip if managed by Radix, react-aria, Headless UI, MUI
    if (isManagedByLibrary(dialog)) {
      markPatched(dialog, "focus-trap");
      continue;
    }
    activateFocusTrap(dialog);
    markPatched(dialog, "focus-trap");
  }
}

/**
 * Clean up focus traps for dialogs that have been closed or removed.
 */
export function cleanDialogFocusTraps(root: Element): void {
  const allTrapped = root.querySelectorAll<HTMLElement>(
    "[data-a11yer-focus-trap]",
  );

  for (const dialog of allTrapped) {
    const isOpen =
      dialog.getAttribute("role") === "dialog" &&
      dialog.getAttribute("aria-modal") === "true" &&
      dialog.getAttribute("aria-hidden") !== "true";

    if (!isOpen) {
      deactivateFocusTrap(dialog);
      dialog.removeAttribute("data-a11yer-focus-trap");
    }
  }
}
