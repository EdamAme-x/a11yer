import { afterEach, describe, expect, it } from "vitest";
import { defaultA11yConfig } from "../../types";
import type { PatchContext } from "../../types";
import { cleanAriaInvalid, patchAriaInvalid, patchAriaRequired } from "./forms";

const ctx: PatchContext = { config: defaultA11yConfig };

afterEach(() => {
  document.body.replaceChildren();
});

describe("patchAriaRequired", () => {
  it("injects aria-required on required inputs", () => {
    const input = document.createElement("input");
    input.required = true;
    document.body.appendChild(input);

    patchAriaRequired(document.body, ctx);
    expect(input.getAttribute("aria-required")).toBe("true");
  });
});

describe("patchAriaInvalid", () => {
  it("links error element to input via aria-invalid and aria-describedby", () => {
    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    const error = document.createElement("div");
    error.className = "error";
    error.textContent = "Required field";
    wrapper.append(input, error);
    document.body.appendChild(wrapper);

    patchAriaInvalid(document.body, ctx);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.hasAttribute("aria-describedby")).toBe(true);
    expect(input.hasAttribute("data-a11yer-error-source")).toBe(true);
  });
});

describe("cleanAriaInvalid", () => {
  it("removes aria-invalid when error element is removed", () => {
    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    const error = document.createElement("div");
    error.className = "error";
    error.id = "err-1";
    error.textContent = "Error";
    wrapper.append(input, error);
    document.body.appendChild(wrapper);

    // First, patch to add aria-invalid
    patchAriaInvalid(document.body, ctx);
    expect(input.getAttribute("aria-invalid")).toBe("true");

    // Remove error element
    error.remove();

    // Clean should remove aria-invalid
    cleanAriaInvalid(document.body);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("data-a11yer-error-source")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });
});
