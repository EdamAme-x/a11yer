import type { PatchContext } from "../../types";
import { getTextContent, isAlreadyLabelled, isPatched, markPatched } from "../../utils/dom";

/**
 * Extract a human-readable label from an image src URL.
 * "/images/hero-banner.jpg" → "Hero Banner"
 * "https://cdn.example.com/product_photo_01.png" → "product photo 01"
 * Returns null if the filename is not meaningful (hash, uuid, etc.)
 */
function altFromSrc(src: string): string | null {
  if (!src) return null;

  try {
    // Get filename without extension
    const url = new URL(src, "https://placeholder.invalid");
    const pathname = url.pathname;
    const filename = pathname.split("/").pop() || "";
    const name = filename.replace(/\.[^.]+$/, ""); // strip extension

    if (!name || name.length < 2) return null;

    // Skip hash-like filenames (e.g., "a1b2c3d4e5.png")
    if (/^[a-f0-9]{8,}$/i.test(name)) return null;
    // Skip UUID-like filenames
    if (/^[a-f0-9-]{32,}$/i.test(name)) return null;

    // Convert all separator characters to spaces, then Title Case
    // Covers: hyphen, underscore, dot, full-width hyphen(ー), en-dash(–), em-dash(—), tilde, plus
    const label = name
      .replace(/[-_.\u30FC\u2013\u2014~+]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase → camel Case
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case

    if (label.length < 2) return null;
    return label;
  } catch {
    return null;
  }
}

/**
 * Try to derive an accessible name for an icon-only interactive element.
 * Checks: title attr, data-tooltip, aria-label (already checked), SVG <title>.
 */
function deriveIconLabel(el: Element): string | null {
  // title attribute
  const title = el.getAttribute("title");
  if (title?.trim()) return title.trim();

  // data-tooltip
  const tooltip = el.getAttribute("data-tooltip");
  if (tooltip?.trim()) return tooltip.trim();

  // SVG <title> element inside
  const svgTitle = el.querySelector("svg title");
  if (svgTitle?.textContent?.trim()) return svgTitle.textContent.trim();

  // aria-description or data-label
  const desc = el.getAttribute("aria-description");
  if (desc?.trim()) return desc.trim();

  return null;
}

function isLikelyDecorative(img: Element): boolean {
  const interactive = img.closest("a, button, [role='button'], [role='link']");
  if (interactive) {
    const text = getTextContent(interactive);
    if (!text) return false; // icon-only — informative
  }

  // Tracking pixels — only check explicit HTML attributes, not computed size
  // (computed size may be 0 before image loads)
  const wAttr = img.getAttribute("width");
  const hAttr = img.getAttribute("height");
  if (wAttr && hAttr && parseInt(wAttr) <= 1 && parseInt(hAttr) <= 1) return true;

  // Explicitly decorative
  const role = img.getAttribute("role");
  if (role === "presentation" || role === "none") return true;

  // If we can derive a meaningful name from the filename, it's likely informative
  const src = img.getAttribute("src") || "";
  if (altFromSrc(src)) return false;

  // No filename hint + not in interactive context → assume decorative
  return !interactive;
}

/**
 * Handle images missing alt:
 * - Tracking pixels (1x1) → alt=""
 * - Decorative → alt=""
 * - Informative → derive alt from filename or mark as image
 */
export function patchImgAlt(root: Element, ctx: PatchContext): void {
  if (!ctx.config.autoImgAlt) return;

  const images = root.querySelectorAll("img:not([alt])");
  for (const img of images) {
    if (isPatched(img, "img-alt")) continue;

    if (isLikelyDecorative(img)) {
      img.setAttribute("alt", "");
    } else {
      // Try to generate alt from filename
      const src = img.getAttribute("src") || "";
      const derived = altFromSrc(src);
      if (derived) {
        img.setAttribute("alt", derived);
      } else {
        // Can't derive — set empty alt + role="img" so SR says "image"
        img.setAttribute("alt", "");
        img.setAttribute("role", "img");
      }
    }
    markPatched(img, "img-alt");
  }
}

/**
 * Handle SVGs inside interactive elements:
 * - If parent has text → SVG is decorative → aria-hidden="true"
 * - If icon-only → try to derive aria-label from title/tooltip/SVG title
 */
export function patchSvgInInteractive(root: Element, _ctx: PatchContext): void {
  const selectors = [
    "button svg:not([aria-hidden])",
    "a svg:not([aria-hidden])",
    '[role="button"] svg:not([aria-hidden])',
    '[role="link"] svg:not([aria-hidden])',
  ];

  const svgs = root.querySelectorAll(selectors.join(","));

  for (const svg of svgs) {
    if (isPatched(svg, "svg-hidden")) continue;

    const parent =
      svg.closest("button") ||
      svg.closest("a") ||
      svg.closest('[role="button"]') ||
      svg.closest('[role="link"]');
    if (!parent) continue;

    const parentText = getTextContent(parent);
    const svgText = getTextContent(svg);
    const nonSvgText = parentText.replace(svgText, "").trim();

    if (nonSvgText) {
      // Parent has text — SVG is decorative
      svg.setAttribute("aria-hidden", "true");
      markPatched(svg, "svg-hidden");
    } else if (isAlreadyLabelled(parent)) {
      // Icon-only but parent already has accessible name (aria-label, title, etc.)
      // SVG is decorative in this context
      svg.setAttribute("aria-hidden", "true");
      markPatched(svg, "svg-hidden");
    } else {
      // Icon-only, no existing label — try to derive one
      const label = deriveIconLabel(parent);
      if (label) {
        parent.setAttribute("aria-label", label);
        svg.setAttribute("aria-hidden", "true");
      }
      markPatched(svg, "svg-hidden");
    }
  }
}
