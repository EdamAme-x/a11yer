import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultA11yConfig } from "../../types";
import type { PatchContext } from "../../types";
import { patchKeyboardHandlers } from "./keyboard";

const ctx: PatchContext = { config: defaultA11yConfig };

afterEach(() => {
  document.body.replaceChildren();
});

function fireKeydown(el: HTMLElement, key: string, shiftKey = false): void {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, shiftKey });
  el.dispatchEvent(event);
}

describe("patchKeyboardHandlers", () => {
  it("adds tabindex=0 to div[role=button]", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "button");
    document.body.appendChild(div);

    patchKeyboardHandlers(document.body, ctx);
    expect(div.getAttribute("tabindex")).toBe("0");
  });

  it("does not overwrite existing tabindex on div[role=button]", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "button");
    div.setAttribute("tabindex", "2");
    document.body.appendChild(div);

    patchKeyboardHandlers(document.body, ctx);
    expect(div.getAttribute("tabindex")).toBe("2");
  });

  it("fires click on Enter for div[role=button]", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "button");
    document.body.appendChild(div);

    const clickSpy = vi.fn();
    div.addEventListener("click", clickSpy);

    patchKeyboardHandlers(document.body, ctx);
    fireKeydown(div, "Enter");

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("fires click on Space for div[role=button]", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "button");
    document.body.appendChild(div);

    const clickSpy = vi.fn();
    div.addEventListener("click", clickSpy);

    patchKeyboardHandlers(document.body, ctx);
    fireKeydown(div, " ");

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("fires click on Space for div[role=checkbox] (toggle role)", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "checkbox");
    div.setAttribute("aria-checked", "false");
    document.body.appendChild(div);

    const clickSpy = vi.fn();
    div.addEventListener("click", clickSpy);

    patchKeyboardHandlers(document.body, ctx);
    fireKeydown(div, " ");

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire click on Enter for div[role=checkbox] (toggle role only responds to Space)", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "checkbox");
    div.setAttribute("aria-checked", "false");
    document.body.appendChild(div);

    const clickSpy = vi.fn();
    div.addEventListener("click", clickSpy);

    patchKeyboardHandlers(document.body, ctx);
    fireKeydown(div, "Enter");

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("handles div[role=switch] with Space", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "switch");
    div.setAttribute("aria-checked", "false");
    document.body.appendChild(div);

    const clickSpy = vi.fn();
    div.addEventListener("click", clickSpy);

    patchKeyboardHandlers(document.body, ctx);
    fireKeydown(div, " ");

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("skips elements managed by Headless UI", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "button");
    div.setAttribute("data-headlessui-state", "open");
    document.body.appendChild(div);

    patchKeyboardHandlers(document.body, ctx);
    // Element should be marked as patched but NOT get a tabindex added by the
    // patcher (because it's library-managed, so the normal patching path is skipped).
    // The element itself had no tabindex, and library-managed path only calls markPatched.
    expect(div.hasAttribute("data-a11yer-keyboard")).toBe(true);
    // tabindex should not have been set because it skipped normal patching
    expect(div.hasAttribute("tabindex")).toBe(false);
  });

  it("does not double-patch an element", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "button");
    document.body.appendChild(div);

    const clickSpy = vi.fn();
    div.addEventListener("click", clickSpy);

    patchKeyboardHandlers(document.body, ctx);
    patchKeyboardHandlers(document.body, ctx); // second call should be no-op

    fireKeydown(div, "Enter");
    expect(clickSpy).toHaveBeenCalledTimes(1); // only one handler
  });

  it("marks patched elements with data-a11yer-keyboard", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "button");
    document.body.appendChild(div);

    patchKeyboardHandlers(document.body, ctx);
    expect(div.hasAttribute("data-a11yer-keyboard")).toBe(true);
  });
});
