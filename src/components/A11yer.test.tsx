import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { A11yer } from "./A11yer";

afterEach(() => {
  document.body.replaceChildren();
  document.getElementById("a11yer-styles")?.remove();
});

describe("A11yer", () => {
  it("renders children", () => {
    render(
      <A11yer>
        <div data-testid="child">Hello</div>
      </A11yer>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("injects skip link automatically", () => {
    render(
      <A11yer>
        <div>App</div>
      </A11yer>,
    );
    const skipLink = document.querySelector(".a11yer-skip-link");
    expect(skipLink).not.toBeNull();
    expect(skipLink?.getAttribute("href")).toBe("#main-content");
  });

  it("accepts config override", () => {
    // Should not throw
    render(
      <A11yer config={{ a11y: { minContrastRatio: 7, autoImgAlt: false } }}>
        <div>App</div>
      </A11yer>,
    );
    expect(screen.getByText("App")).toBeTruthy();
  });

  it("renders with no config", () => {
    render(
      <A11yer>
        <main>Content</main>
      </A11yer>,
    );
    expect(document.querySelector("main")).toBeTruthy();
  });

  it("does not crash when autoContrastFix is false", () => {
    expect(() =>
      render(
        <A11yer config={{ a11y: { autoContrastFix: false } }}>
          <div>Safe</div>
        </A11yer>,
      ),
    ).not.toThrow();
    expect(screen.getByText("Safe")).toBeTruthy();
  });

  it("does not crash when autoImgAlt is false", () => {
    expect(() =>
      render(
        <A11yer config={{ a11y: { autoImgAlt: false } }}>
          <div>Images disabled</div>
        </A11yer>,
      ),
    ).not.toThrow();
    expect(screen.getByText("Images disabled")).toBeTruthy();
  });

  it("does not crash with an empty config object", () => {
    expect(() =>
      render(
        <A11yer config={{}}>
          <div>Empty config</div>
        </A11yer>,
      ),
    ).not.toThrow();
    expect(screen.getByText("Empty config")).toBeTruthy();
  });

  it("does not crash with no config prop at all", () => {
    expect(() =>
      render(
        <A11yer>
          <span>No config</span>
        </A11yer>,
      ),
    ).not.toThrow();
    expect(screen.getByText("No config")).toBeTruthy();
  });

  it("injects style element into the document head", () => {
    render(
      <A11yer>
        <div>Styled</div>
      </A11yer>,
    );
    const styleEl = document.getElementById("a11yer-styles");
    expect(styleEl).not.toBeNull();
  });

  it("applies reduced-motion=always config", () => {
    render(
      <A11yer config={{ a11y: { reducedMotion: "always" } }}>
        <div>Motion reduced</div>
      </A11yer>,
    );
    const styleEl = document.getElementById("a11yer-styles");
    expect(styleEl?.textContent).toContain("prefers-reduced-motion");
  });
});
