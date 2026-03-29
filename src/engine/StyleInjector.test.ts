import { afterEach, describe, expect, it } from "vitest";
import { StyleInjector } from "./StyleInjector";
import type { StyleInjectorOptions } from "./StyleInjector";

const baseOptions: StyleInjectorOptions = {
  focusVisible: false,
  focusStyle: { outline: "2px solid currentColor", outlineOffset: "2px" },
  reducedMotion: false,
};

afterEach(() => {
  // Clean up any injected style element
  document.getElementById("a11yer-styles")?.remove();
  document.getElementById("a11yer-contrast-fixes")?.remove();
});

describe("StyleInjector", () => {
  it("inject() creates a style element with id a11yer-styles", () => {
    const injector = new StyleInjector();
    injector.inject(baseOptions);

    const styleEl = document.getElementById("a11yer-styles");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.tagName.toLowerCase()).toBe("style");
  });

  it("inject() sets data-a11yer=styles attribute on the style element", () => {
    const injector = new StyleInjector();
    injector.inject(baseOptions);

    const styleEl = document.getElementById("a11yer-styles");
    expect(styleEl?.getAttribute("data-a11yer")).toBe("styles");
  });

  it("inject() always includes the sr-only utility class", () => {
    const injector = new StyleInjector();
    injector.inject(baseOptions);

    const styleEl = document.getElementById("a11yer-styles");
    expect(styleEl?.textContent).toContain(".a11yer-sr-only");
  });

  it("inject() includes focus-visible CSS when focusVisible=true", () => {
    const injector = new StyleInjector();
    injector.inject({ ...baseOptions, focusVisible: true });

    const styleEl = document.getElementById("a11yer-styles");
    expect(styleEl?.textContent).toContain(":focus-visible");
  });

  it("inject() does NOT include focus-visible CSS when focusVisible=false", () => {
    const injector = new StyleInjector();
    injector.inject({ ...baseOptions, focusVisible: false });

    const styleEl = document.getElementById("a11yer-styles");
    expect(styleEl?.textContent).not.toContain(":focus-visible");
  });

  it("inject() includes reduced-motion CSS when reducedMotion=true", () => {
    const injector = new StyleInjector();
    injector.inject({ ...baseOptions, reducedMotion: true });

    const styleEl = document.getElementById("a11yer-styles");
    expect(styleEl?.textContent).toContain("prefers-reduced-motion");
  });

  it("inject() does NOT include reduced-motion CSS when reducedMotion=false", () => {
    const injector = new StyleInjector();
    injector.inject({ ...baseOptions, reducedMotion: false });

    const styleEl = document.getElementById("a11yer-styles");
    expect(styleEl?.textContent).not.toContain("prefers-reduced-motion");
  });

  it("inject() uses the custom focusStyle outline", () => {
    const injector = new StyleInjector();
    injector.inject({
      ...baseOptions,
      focusVisible: true,
      focusStyle: { outline: "3px dotted red", outlineOffset: "4px" },
    });

    const styleEl = document.getElementById("a11yer-styles");
    expect(styleEl?.textContent).toContain("3px dotted red");
    expect(styleEl?.textContent).toContain("4px");
  });

  it("inject() reuses an existing style element on second call", () => {
    const injector = new StyleInjector();
    injector.inject(baseOptions);
    const firstEl = document.getElementById("a11yer-styles");

    injector.inject({ ...baseOptions, reducedMotion: true });
    const secondEl = document.getElementById("a11yer-styles");

    // Should be the same DOM node
    expect(firstEl).toBe(secondEl);
    // Content should have been updated
    expect(secondEl?.textContent).toContain("prefers-reduced-motion");
  });

  it("remove() removes the style element from the DOM", () => {
    const injector = new StyleInjector();
    injector.inject(baseOptions);
    expect(document.getElementById("a11yer-styles")).not.toBeNull();

    injector.remove();
    expect(document.getElementById("a11yer-styles")).toBeNull();
  });

  it("remove() does not throw when called before inject()", () => {
    const injector = new StyleInjector();
    expect(() => injector.remove()).not.toThrow();
  });

  it("remove() can be called multiple times without throwing", () => {
    const injector = new StyleInjector();
    injector.inject(baseOptions);
    injector.remove();
    expect(() => injector.remove()).not.toThrow();
  });

  it("inject() picks up an existing style element already in the DOM", () => {
    // Simulate a pre-existing style element (e.g. from SSR)
    const existing = document.createElement("style");
    existing.id = "a11yer-styles";
    document.head.appendChild(existing);

    const injector = new StyleInjector();
    injector.inject(baseOptions);

    const styleEl = document.getElementById("a11yer-styles");
    // Should be the same element that was already there
    expect(styleEl).toBe(existing);
    // Content should have been populated
    expect(styleEl?.textContent).toContain(".a11yer-sr-only");
  });
});
