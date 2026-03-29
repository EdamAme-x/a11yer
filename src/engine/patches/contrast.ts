import type { PatchContext } from "../../types";
import type { RGB } from "../../utils/a11y";
import { contrastRatioFromColors, parseColorToRgb, suggestColor } from "../../utils/a11y";
import { ensureId, isPatched, isVisible, markPatched } from "../../utils/dom";

const CONTRAST_STYLE_ID = "a11yer-contrast-fixes";
const contrastRules = new Set<string>();

function getOrCreateContrastStyleEl(): HTMLStyleElement | null {
  if (typeof document === "undefined") return null;

  let el = document.getElementById(CONTRAST_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = CONTRAST_STYLE_ID;
    el.setAttribute("data-a11yer", "contrast");
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Parse rgba alpha from a CSS color string.
 * Returns alpha 0-1, or 1 if opaque/no alpha.
 */
function parseAlpha(color: string): number {
  const rgbaMatch = color.match(
    /^rgba?\(\s*\d+\s*[,\s]\s*\d+\s*[,\s]\s*\d+\s*[,/\s]\s*([\d.]+)/,
  );
  if (rgbaMatch) return parseFloat(rgbaMatch[1]);
  return 1;
}

/**
 * Alpha-blend a foreground RGBA color onto an opaque background RGB.
 * result = fg * alpha + bg * (1 - alpha)
 */
function alphaBlend(fg: RGB, fgAlpha: number, bg: RGB): RGB {
  return {
    r: Math.round(fg.r * fgAlpha + bg.r * (1 - fgAlpha)),
    g: Math.round(fg.g * fgAlpha + bg.g * (1 - fgAlpha)),
    b: Math.round(fg.b * fgAlpha + bg.b * (1 - fgAlpha)),
  };
}

/**
 * Walk up the DOM tree, alpha-blending semi-transparent backgrounds
 * until we reach an opaque layer (or the page root, assumed white).
 */
function getEffectiveBackgroundColor(el: Element): string | null {
  if (typeof window === "undefined") return null;

  // Collect layers bottom-up
  const layers: Array<{ rgb: RGB; alpha: number }> = [];
  let current: Element | null = el;

  while (current) {
    const style = window.getComputedStyle(current);
    const bg = style.backgroundColor;

    if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
      const rgb = parseColorToRgb(bg);
      const alpha = parseAlpha(bg);
      if (rgb) {
        layers.push({ rgb, alpha });
        if (alpha >= 1) break; // Opaque — stop here
      }
    }
    current = current.parentElement;
  }

  if (layers.length === 0) return "rgb(255, 255, 255)";

  // Blend from back (last = topmost ancestor) to front
  let result: RGB = { r: 255, g: 255, b: 255 }; // page background
  for (let i = layers.length - 1; i >= 0; i--) {
    result = alphaBlend(layers[i].rgb, layers[i].alpha, result);
  }

  return `rgb(${result.r}, ${result.g}, ${result.b})`;
}

function rgbToHex(color: string): string | null {
  const rgb = parseColorToRgb(color);
  if (!rgb) return null;
  return `#${((1 << 24) | (rgb.r << 16) | (rgb.g << 8) | rgb.b).toString(16).slice(1)}`;
}

/**
 * Resolve any CSS color to an rgb() string using a canvas.
 * Fallback for color-mix(), light-dark(), currentColor, etc.
 */
function resolveColorViaCanvas(color: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return null;
  }
}

export function fixContrastViolations(
  root: Element,
  ctx: PatchContext,
): void {
  if (!ctx.config.autoContrastFix) return;
  if (typeof window === "undefined") return;

  const minRatio = ctx.config.minContrastRatio;
  const styleEl = getOrCreateContrastStyleEl();
  if (!styleEl) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let newRules = false;
  let count = 0;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (count >= 100) break;
    const el = node.parentElement;
    if (!el) continue;
    if (isPatched(el, "contrast")) continue;
    if (!isVisible(el)) continue;

    let fgColor = window.getComputedStyle(el).color;
    const bgColor = getEffectiveBackgroundColor(el);
    if (!fgColor || !bgColor) continue;

    // If parseColorToRgb can't handle fg, try canvas resolution
    if (!parseColorToRgb(fgColor)) {
      const resolved = resolveColorViaCanvas(fgColor);
      if (resolved) fgColor = resolved;
    }

    const ratio = contrastRatioFromColors(fgColor, bgColor);
    if (ratio <= 0 || ratio >= minRatio) {
      markPatched(el, "contrast");
      continue;
    }

    const fgHex = rgbToHex(fgColor);
    const bgHex = rgbToHex(bgColor);
    if (!fgHex || !bgHex) {
      markPatched(el, "contrast");
      continue;
    }

    const fixedColor = suggestColor(fgHex, bgHex, minRatio);
    const id = ensureId(el, "a11yer-c");

    // Use high-specificity selector instead of !important where possible.
    // [id="x"][id="x"] has specificity (0,2,0) which beats most single-class selectors.
    // Fall back to !important only as last resort.
    contrastRules.add(`[id="${id}"][id="${id}"] { color: ${fixedColor}; }`);
    markPatched(el, "contrast");
    newRules = true;
    count++;
  }

  if (newRules) {
    styleEl.textContent = Array.from(contrastRules).join("\n");
  }
}
