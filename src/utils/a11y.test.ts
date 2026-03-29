import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  contrastRatioFromColors,
  getLuminance,
  meetsContrastRatio,
  parseColorToRgb,
  suggestColor,
  wcagLevel,
} from "./a11y";

describe("contrastRatio", () => {
  it("returns 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("returns 1 for identical colors", () => {
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 1);
  });

  it("handles shorthand hex", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 0);
  });

  it("returns 0 for invalid hex", () => {
    expect(contrastRatio("invalid", "#fff")).toBe(0);
  });

  it("calculates intermediate contrast correctly", () => {
    const ratio = contrastRatio("#0066cc", "#ffffff");
    expect(ratio).toBeGreaterThan(4.5);
    expect(ratio).toBeLessThan(7);
  });
});

describe("meetsContrastRatio", () => {
  it("returns true when contrast meets WCAG AA", () => {
    expect(meetsContrastRatio("#000000", "#ffffff", 4.5)).toBe(true);
  });

  it("returns false when contrast is insufficient", () => {
    expect(meetsContrastRatio("#cccccc", "#ffffff", 4.5)).toBe(false);
  });

  it("returns true for AAA with very high contrast", () => {
    expect(meetsContrastRatio("#000000", "#ffffff", 7)).toBe(true);
  });
});

describe("getLuminance", () => {
  it("returns 0 for black", () => {
    expect(getLuminance("#000000")).toBeCloseTo(0, 4);
  });

  it("returns 1 for white", () => {
    expect(getLuminance("#ffffff")).toBeCloseTo(1, 4);
  });

  it("returns 0 for invalid hex", () => {
    expect(getLuminance("invalid")).toBe(0);
  });
});

describe("wcagLevel", () => {
  it("returns AAA for ratio >= 7", () => {
    expect(wcagLevel(7)).toBe("AAA");
    expect(wcagLevel(21)).toBe("AAA");
  });

  it("returns AA for ratio >= 4.5 and < 7", () => {
    expect(wcagLevel(4.5)).toBe("AA");
    expect(wcagLevel(6.9)).toBe("AA");
  });

  it("returns fail for ratio < 4.5", () => {
    expect(wcagLevel(4.4)).toBe("fail");
    expect(wcagLevel(1)).toBe("fail");
  });
});

describe("suggestColor", () => {
  it("returns the original color if contrast already meets ratio", () => {
    expect(suggestColor("#000000", "#ffffff", 4.5)).toBe("#000000");
  });

  it("darkens foreground on light background", () => {
    const result = suggestColor("#cccccc", "#ffffff", 4.5);
    expect(meetsContrastRatio(result, "#ffffff", 4.5)).toBe(true);
  });

  it("lightens foreground on dark background", () => {
    const result = suggestColor("#333333", "#000000", 4.5);
    expect(meetsContrastRatio(result, "#000000", 4.5)).toBe(true);
  });

  it("returns original for invalid colors", () => {
    expect(suggestColor("invalid", "#ffffff", 4.5)).toBe("invalid");
  });

  it("returns fallback black when 255 iterations cannot reach target on light bg", () => {
    // Use a color that starts already near white on a white background —
    // darkening 255 steps from #ffffff still may not reach 21:1,
    // but the loop will exhaust and return the fallback "#000000".
    // We want direction=-1 (bg is light), so result should be "#000000".
    const result = suggestColor("#ffffff", "#ffffff", 21.1);
    expect(result).toBe("#000000");
  });

  it("returns fallback white when 255 iterations cannot reach target on dark bg", () => {
    // Requesting an impossible ratio on a black bg — fallback is "#ffffff".
    const result = suggestColor("#000000", "#000000", 21.1);
    expect(result).toBe("#ffffff");
  });
});

describe("parseColorToRgb", () => {
  it("parses 6-digit hex", () => {
    expect(parseColorToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColorToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColorToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("parses 3-digit hex shorthand", () => {
    expect(parseColorToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColorToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColorToRgb("#000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("parses 8-digit hex with alpha (strips alpha)", () => {
    expect(parseColorToRgb("#ff000080")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("parses 4-digit hex with alpha (strips alpha)", () => {
    expect(parseColorToRgb("#f008")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("parses rgb()", () => {
    expect(parseColorToRgb("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("parses rgba()", () => {
    expect(parseColorToRgb("rgba(10, 20, 30, 0.5)")).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("parses hsl() — pure red", () => {
    const result = parseColorToRgb("hsl(0, 100%, 50%)");
    expect(result).not.toBeNull();
    expect(result!.r).toBe(255);
    expect(result!.g).toBe(0);
    expect(result!.b).toBe(0);
  });

  it("parses hsla()", () => {
    const result = parseColorToRgb("hsla(120, 100%, 50%, 0.5)");
    expect(result).not.toBeNull();
    expect(result!.r).toBe(0);
    expect(result!.g).toBe(255);
    expect(result!.b).toBe(0);
  });

  it("parses hsl edge case h=360 (wraps to red)", () => {
    const result = parseColorToRgb("hsl(360, 100%, 50%)");
    expect(result).not.toBeNull();
    // h=360 falls into the else branch (r1=c, b1=x) — implementation result
    expect(result!.r).toBeGreaterThan(200);
  });

  it("parses hsl edge case s=0 (grey)", () => {
    const result = parseColorToRgb("hsl(0, 0%, 50%)");
    expect(result).not.toBeNull();
    // achromatic — r=g=b
    expect(result!.r).toBe(result!.g);
    expect(result!.g).toBe(result!.b);
  });

  it("parses hsl edge case l=0 (black)", () => {
    const result = parseColorToRgb("hsl(0, 100%, 0%)");
    expect(result).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("parses hsl edge case l=100 (white)", () => {
    const result = parseColorToRgb("hsl(0, 100%, 100%)");
    expect(result).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("parses oklch()", () => {
    const result = parseColorToRgb("oklch(0.6 0.15 30)");
    expect(result).not.toBeNull();
    expect(result!.r).toBeGreaterThanOrEqual(0);
    expect(result!.r).toBeLessThanOrEqual(255);
  });

  it("parses oklch() with percentage lightness", () => {
    const result = parseColorToRgb("oklch(60% 0.15 30)");
    expect(result).not.toBeNull();
    expect(result!.r).toBeGreaterThanOrEqual(0);
  });

  it("parses oklab()", () => {
    const result = parseColorToRgb("oklab(0.5 0.05 -0.05)");
    expect(result).not.toBeNull();
    expect(result!.r).toBeGreaterThanOrEqual(0);
    expect(result!.r).toBeLessThanOrEqual(255);
  });

  it("returns null for transparent", () => {
    expect(parseColorToRgb("transparent")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseColorToRgb("")).toBeNull();
  });

  it("returns null for invalid color", () => {
    expect(parseColorToRgb("notacolor")).toBeNull();
    expect(parseColorToRgb("banana")).toBeNull();
  });
});

describe("contrastRatioFromColors", () => {
  it("calculates contrast from rgb() inputs", () => {
    const ratio = contrastRatioFromColors("rgb(0, 0, 0)", "rgb(255, 255, 255)");
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("calculates contrast from rgba() inputs", () => {
    const ratio = contrastRatioFromColors("rgba(0,0,0,1)", "rgba(255,255,255,1)");
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("returns 1 for identical rgb colors", () => {
    const ratio = contrastRatioFromColors("rgb(100, 100, 100)", "rgb(100, 100, 100)");
    expect(ratio).toBeCloseTo(1, 1);
  });

  it("returns 0 when first color is invalid", () => {
    expect(contrastRatioFromColors("transparent", "rgb(0,0,0)")).toBe(0);
  });

  it("returns 0 when second color is invalid", () => {
    expect(contrastRatioFromColors("rgb(0,0,0)", "transparent")).toBe(0);
  });

  it("works with hex inputs", () => {
    const ratio = contrastRatioFromColors("#000000", "#ffffff");
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("works with hsl inputs", () => {
    const ratio = contrastRatioFromColors("hsl(0, 0%, 0%)", "hsl(0, 0%, 100%)");
    expect(ratio).toBeCloseTo(21, 0);
  });
});
