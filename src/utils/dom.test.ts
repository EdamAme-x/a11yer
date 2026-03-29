import { afterEach, describe, expect, it } from "vitest";
import {
  ensureId,
  getFocusableElements,
  getTextContent,
  isAlreadyLabelled,
  isInteractive,
  isManagedByLibrary,
  isPatched,
  markPatched,
} from "./dom";

afterEach(() => {
  document.body.replaceChildren();
});

// ---------------------------------------------------------------------------
// isAlreadyLabelled
// ---------------------------------------------------------------------------

describe("isAlreadyLabelled", () => {
  it("returns true when element has aria-label", () => {
    const el = document.createElement("input");
    el.setAttribute("aria-label", "Search");
    document.body.appendChild(el);
    expect(isAlreadyLabelled(el)).toBe(true);
  });

  it("returns true when element has aria-labelledby", () => {
    const el = document.createElement("input");
    el.setAttribute("aria-labelledby", "lbl");
    document.body.appendChild(el);
    expect(isAlreadyLabelled(el)).toBe(true);
  });

  it("returns true when element has title attribute", () => {
    const el = document.createElement("input");
    el.setAttribute("title", "Email address");
    document.body.appendChild(el);
    expect(isAlreadyLabelled(el)).toBe(true);
  });

  it("returns true when element has an associated label[for]", () => {
    const label = document.createElement("label");
    label.setAttribute("for", "my-input");
    label.textContent = "Name";
    const input = document.createElement("input");
    input.id = "my-input";
    document.body.appendChild(label);
    document.body.appendChild(input);
    expect(isAlreadyLabelled(input)).toBe(true);
  });

  it("returns true when element is wrapped by a label", () => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    label.appendChild(input);
    document.body.appendChild(label);
    expect(isAlreadyLabelled(input)).toBe(true);
  });

  it("returns false when element has none of the above", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    expect(isAlreadyLabelled(el)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isInteractive
// ---------------------------------------------------------------------------

describe("isInteractive", () => {
  it("returns true for a button element", () => {
    const el = document.createElement("button");
    expect(isInteractive(el)).toBe(true);
  });

  it("returns true for an anchor with href", () => {
    const el = document.createElement("a");
    el.setAttribute("href", "#");
    expect(isInteractive(el)).toBe(true);
  });

  it("returns false for an anchor without href", () => {
    const el = document.createElement("a");
    expect(isInteractive(el)).toBe(false);
  });

  it("returns true for a visible input", () => {
    const el = document.createElement("input");
    el.type = "text";
    expect(isInteractive(el)).toBe(true);
  });

  it("returns false for a hidden input", () => {
    const el = document.createElement("input");
    el.type = "hidden";
    expect(isInteractive(el)).toBe(false);
  });

  it("returns true for div[role=button]", () => {
    const el = document.createElement("div");
    el.setAttribute("role", "button");
    expect(isInteractive(el)).toBe(true);
  });

  it("returns false for a plain div", () => {
    const el = document.createElement("div");
    expect(isInteractive(el)).toBe(false);
  });

  it("returns true for element with positive tabindex", () => {
    const el = document.createElement("div");
    el.setAttribute("tabindex", "0");
    expect(isInteractive(el)).toBe(true);
  });

  it("returns false for element with tabindex=-1", () => {
    const el = document.createElement("div");
    el.setAttribute("tabindex", "-1");
    expect(isInteractive(el)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getTextContent
// ---------------------------------------------------------------------------

describe("getTextContent", () => {
  it("returns text content of a simple element", () => {
    const el = document.createElement("div");
    el.textContent = "Hello";
    expect(getTextContent(el)).toBe("Hello");
  });

  it("returns concatenated text from nested elements", () => {
    const el = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = "World";
    el.appendChild(document.createTextNode("Hello "));
    el.appendChild(span);
    expect(getTextContent(el)).toBe("Hello World");
  });

  it("excludes aria-hidden subtrees", () => {
    const el = document.createElement("div");
    el.appendChild(document.createTextNode("Visible "));
    const hidden = document.createElement("span");
    hidden.setAttribute("aria-hidden", "true");
    hidden.textContent = "Hidden";
    el.appendChild(hidden);
    expect(getTextContent(el)).toBe("Visible");
  });

  it("returns empty string for an aria-hidden element itself", () => {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.textContent = "Hidden";
    expect(getTextContent(el)).toBe("");
  });

  it("returns trimmed text", () => {
    const el = document.createElement("div");
    el.textContent = "  padded  ";
    expect(getTextContent(el)).toBe("padded");
  });
});

// ---------------------------------------------------------------------------
// markPatched / isPatched roundtrip
// ---------------------------------------------------------------------------

describe("markPatched / isPatched", () => {
  it("marks an element as patched under a key", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    markPatched(el, "keyboard");
    expect(isPatched(el, "keyboard")).toBe(true);
  });

  it("returns false before patching", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(isPatched(el, "keyboard")).toBe(false);
  });

  it("uses separate namespaces per key", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    markPatched(el, "keyboard");
    expect(isPatched(el, "keyboard")).toBe(true);
    expect(isPatched(el, "autocomplete")).toBe(false);
  });

  it("sets the attribute data-a11yer-<key>", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    markPatched(el, "focus-trap");
    expect(el.hasAttribute("data-a11yer-focus-trap")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getFocusableElements
// ---------------------------------------------------------------------------

describe("getFocusableElements", () => {
  it("includes focusable buttons", () => {
    const container = document.createElement("div");
    const btn = document.createElement("button");
    btn.textContent = "Click";
    container.appendChild(btn);
    document.body.appendChild(container);
    const result = getFocusableElements(container);
    expect(result).toContain(btn);
  });

  it("includes anchors with href", () => {
    const container = document.createElement("div");
    const a = document.createElement("a");
    a.setAttribute("href", "#");
    a.textContent = "Link";
    container.appendChild(a);
    document.body.appendChild(container);
    const result = getFocusableElements(container);
    expect(result).toContain(a);
  });

  it("excludes disabled buttons", () => {
    const container = document.createElement("div");
    const btn = document.createElement("button");
    btn.disabled = true;
    btn.textContent = "Disabled";
    container.appendChild(btn);
    document.body.appendChild(container);
    const result = getFocusableElements(container);
    expect(result).not.toContain(btn);
  });

  it("excludes elements with hidden attribute", () => {
    const container = document.createElement("div");
    const btn = document.createElement("button");
    btn.setAttribute("hidden", "");
    btn.textContent = "Hidden";
    container.appendChild(btn);
    document.body.appendChild(container);
    const result = getFocusableElements(container);
    expect(result).not.toContain(btn);
  });

  it("includes inputs (not disabled, not hidden type)", () => {
    const container = document.createElement("div");
    const input = document.createElement("input");
    input.type = "text";
    container.appendChild(input);
    document.body.appendChild(container);
    const result = getFocusableElements(container);
    expect(result).toContain(input);
  });
});

// ---------------------------------------------------------------------------
// ensureId
// ---------------------------------------------------------------------------

describe("ensureId", () => {
  it("generates an id when element has none", () => {
    const el = document.createElement("button");
    document.body.appendChild(el);
    const id = ensureId(el, "btn");
    expect(id).toMatch(/^btn-/);
    expect(el.id).toBe(id);
  });

  it("preserves an existing id", () => {
    const el = document.createElement("button");
    el.id = "existing-id";
    document.body.appendChild(el);
    const id = ensureId(el, "btn");
    expect(id).toBe("existing-id");
    expect(el.id).toBe("existing-id");
  });

  it("uses the given prefix", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const id = ensureId(el, "tooltip");
    expect(id.startsWith("tooltip-")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isManagedByLibrary
// ---------------------------------------------------------------------------

describe("isManagedByLibrary", () => {
  it("returns true for element with data-radix-collection-item", () => {
    const el = document.createElement("div");
    el.setAttribute("data-radix-collection-item", "");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(true);
  });

  it("returns true for element with data-radix-focus-guard", () => {
    const el = document.createElement("div");
    el.setAttribute("data-radix-focus-guard", "");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(true);
  });

  it("returns true for element with data-headlessui-state", () => {
    const el = document.createElement("div");
    el.setAttribute("data-headlessui-state", "open");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(true);
  });

  it("returns true for element with data-headlessui attribute", () => {
    const el = document.createElement("div");
    el.setAttribute("data-headlessui", "");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(true);
  });

  it("returns true for element with Mui class name", () => {
    const el = document.createElement("div");
    el.setAttribute("class", "MuiButton-root");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(true);
  });

  it("returns false for element with non-Mui class name", () => {
    const el = document.createElement("div");
    el.setAttribute("class", "my-button");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(false);
  });

  it("returns true for element with data-rac attribute", () => {
    const el = document.createElement("div");
    el.setAttribute("data-rac", "");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(true);
  });

  it("returns true for element with data-react-aria attribute", () => {
    const el = document.createElement("div");
    el.setAttribute("data-react-aria-focus-guard", "");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(true);
  });

  it("returns true for Ark/Zag element with both data-scope and data-part", () => {
    const el = document.createElement("div");
    el.setAttribute("data-scope", "menu");
    el.setAttribute("data-part", "trigger");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(true);
  });

  it("returns false for element with only data-scope (no data-part)", () => {
    const el = document.createElement("div");
    el.setAttribute("data-scope", "menu");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(false);
  });

  it("returns false for a plain element", () => {
    const el = document.createElement("div");
    el.setAttribute("role", "button");
    document.body.appendChild(el);
    expect(isManagedByLibrary(el)).toBe(false);
  });
});
