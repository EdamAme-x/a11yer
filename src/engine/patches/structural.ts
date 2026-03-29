import type { PatchContext } from "../../types";
import { isPatched, markPatched } from "../../utils/dom";

/** Inject lang attribute on <html> if missing */
export function patchHtmlLang(_ctx: PatchContext): void {
  if (typeof document === "undefined") return;

  const html = document.documentElement;
  if (html.lang) return;
  if (isPatched(html, "lang")) return;

  const lang =
    typeof navigator !== "undefined" ? navigator.language || "en" : "en";
  html.setAttribute("lang", lang);
  markPatched(html, "lang");
}

/**
 * Ensure <main> has an id for skip link, and sync the skip link href.
 * If <main> already has an id, the skip link href is updated to match.
 */
export function patchSkipLinkTarget(root: Element): void {
  if (typeof document === "undefined") return;

  const main = root.querySelector("main");
  if (!main) return;
  if (isPatched(main, "skip-target")) return;

  // Set id if missing
  if (!main.id) {
    main.id = "main-content";
  }

  // Sync skip link href to match the main's actual id
  const skipLink = document.querySelector(".a11yer-skip-link");
  if (skipLink) {
    skipLink.setAttribute("href", `#${main.id}`);
  }

  markPatched(main, "skip-target");
}

/**
 * Auto-set document.title from first <h1> if empty (WCAG 2.4.2).
 */
export function patchDocumentTitle(_ctx: PatchContext): void {
  if (typeof document === "undefined") return;
  if (document.title) return;

  const h1 = document.querySelector("h1");
  if (h1?.textContent?.trim()) {
    document.title = h1.textContent.trim();
  }
}
