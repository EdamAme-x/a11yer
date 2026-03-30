import { afterEach, describe, expect, it } from "vitest";
import { defaultA11yConfig } from "../../types";
import type { PatchContext } from "../../types";
import { patchImgAlt, patchSvgInInteractive } from "./images";

const ctx: PatchContext = { config: defaultA11yConfig };

afterEach(() => {
  document.body.replaceChildren();
});

describe("patchImgAlt", () => {
  it("derives alt from filename for standalone images", () => {
    const img = document.createElement("img");
    img.src = "/images/hero-banner.jpg";
    document.body.appendChild(img);

    patchImgAlt(document.body, ctx);
    expect(img.getAttribute("alt")).toBe("Hero Banner");
  });

  it("injects alt='' on tracking pixel (width=1 height=1)", () => {
    const img = document.createElement("img");
    img.src = "/pixel.gif";
    img.setAttribute("width", "1");
    img.setAttribute("height", "1");
    document.body.appendChild(img);

    patchImgAlt(document.body, ctx);
    expect(img.getAttribute("alt")).toBe("");
  });

  it("falls back to 'Image' on hash-filename images", () => {
    const img = document.createElement("img");
    img.src = "/assets/a1b2c3d4e5f6a7b8.png";
    document.body.appendChild(img);

    patchImgAlt(document.body, ctx);
    expect(img.getAttribute("alt")).toBe("Image");
  });

  it("strips numeric/hex-only words from filename", () => {
    const img = document.createElement("img");
    img.src = "https://example.com/photo-1506905925346-21bda4d32df4.jpg";
    document.body.appendChild(img);

    patchImgAlt(document.body, ctx);
    // "photo" remains, numeric/hex parts stripped → "Photo"
    expect(img.getAttribute("alt")).toBe("Photo");
  });

  it("falls back to 'Image' when all words are numeric", () => {
    const img = document.createElement("img");
    img.src = "/images/12345-67890.jpg";
    document.body.appendChild(img);

    patchImgAlt(document.body, ctx);
    expect(img.getAttribute("alt")).toBe("Image");
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
