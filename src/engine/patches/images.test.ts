import { afterEach, describe, expect, it } from "vitest";
import { defaultA11yConfig } from "../../types";
import type { PatchContext } from "../../types";
import { patchImgAlt, patchSvgInInteractive } from "./images";

const ctx: PatchContext = { config: defaultA11yConfig };

afterEach(() => {
  document.body.replaceChildren();
});

describe("patchImgAlt", () => {
  it("injects alt='' on img missing alt", () => {
    const img = document.createElement("img");
    img.src = "test.png";
    document.body.appendChild(img);

    patchImgAlt(document.body, ctx);
    expect(img.getAttribute("alt")).toBe("");
  });

  it("does not touch img with existing alt", () => {
    const img = document.createElement("img");
    img.src = "test.png";
    img.alt = "A photo";
    document.body.appendChild(img);

    patchImgAlt(document.body, ctx);
    expect(img.getAttribute("alt")).toBe("A photo");
  });

  it("respects autoImgAlt=false config", () => {
    const img = document.createElement("img");
    img.src = "test.png";
    document.body.appendChild(img);

    patchImgAlt(document.body, { config: { ...defaultA11yConfig, autoImgAlt: false } });
    expect(img.hasAttribute("alt")).toBe(false);
  });
});

describe("patchSvgInInteractive", () => {
  it("adds aria-hidden to SVG in button with text", () => {
    const button = document.createElement("button");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    button.appendChild(svg);
    button.appendChild(document.createTextNode(" Click me"));
    document.body.appendChild(button);

    patchSvgInInteractive(document.body, ctx);
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });
});
