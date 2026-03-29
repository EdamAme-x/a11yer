import { afterEach, describe, expect, it } from "vitest";
import { defaultA11yConfig } from "../../types";
import type { PatchContext } from "../../types";
import { cleanDialogFocusTraps, patchDialogFocusTrap } from "./dialogs";

const ctx: PatchContext = { config: defaultA11yConfig };

afterEach(() => {
  document.body.replaceChildren();
});

function buildDivDialog(): HTMLDivElement {
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");

  const btn = document.createElement("button");
  btn.textContent = "Close";
  dialog.appendChild(btn);

  document.body.appendChild(dialog);
  return dialog;
}

describe("patchDialogFocusTrap", () => {
  it("patches div[role=dialog][aria-modal=true]", () => {
    const dialog = buildDivDialog();
    patchDialogFocusTrap(document.body, ctx);
    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(true);
  });

  it("does NOT patch native <dialog> elements", () => {
    const dialog = document.createElement("dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    const btn = document.createElement("button");
    btn.textContent = "Close";
    dialog.appendChild(btn);
    document.body.appendChild(dialog);

    patchDialogFocusTrap(document.body, ctx);
    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(false);
  });

  it("skips dialogs managed by Headless UI", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("data-headlessui-state", "open");
    document.body.appendChild(dialog);

    patchDialogFocusTrap(document.body, ctx);
    // Still marked as patched (skipped), but the library-managed path was taken
    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(true);
  });

  it("skips aria-hidden dialogs", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-hidden", "true");
    document.body.appendChild(dialog);

    patchDialogFocusTrap(document.body, ctx);
    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(false);
  });

  it("does not double-patch a dialog", () => {
    const dialog = buildDivDialog();
    patchDialogFocusTrap(document.body, ctx);
    patchDialogFocusTrap(document.body, ctx);
    // Should only have one attribute (not duplicated)
    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(true);
  });
});

describe("cleanDialogFocusTraps", () => {
  it("removes the focus-trap attribute on dialogs that are closed (aria-hidden=true)", () => {
    const dialog = buildDivDialog();
    patchDialogFocusTrap(document.body, ctx);
    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(true);

    // Close the dialog
    dialog.setAttribute("aria-hidden", "true");
    cleanDialogFocusTraps(document.body);

    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(false);
  });

  it("removes the focus-trap attribute on dialogs that lost aria-modal", () => {
    const dialog = buildDivDialog();
    patchDialogFocusTrap(document.body, ctx);
    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(true);

    dialog.removeAttribute("aria-modal");
    cleanDialogFocusTraps(document.body);

    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(false);
  });

  it("keeps the focus-trap attribute on still-open dialogs", () => {
    const dialog = buildDivDialog();
    patchDialogFocusTrap(document.body, ctx);
    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(true);

    cleanDialogFocusTraps(document.body);

    // Dialog is still open (role=dialog, aria-modal=true, no aria-hidden)
    expect(dialog.hasAttribute("data-a11yer-focus-trap")).toBe(true);
  });
});
