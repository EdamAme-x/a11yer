import type { A11yConfig, PatchContext } from "../types";
import { announce } from "../utils/announce";
import { isPatched, markPatched } from "../utils/dom";
import { cleanCompositeWidgets, patchCompositeWidgets } from "./patches/composites";
import { fixContrastViolations } from "./patches/contrast";
import { cleanDialogFocusTraps, patchDialogFocusTrap } from "./patches/dialogs";
import {
  cleanAriaInvalid,
  patchAriaInvalid,
  patchAriaRequired,
  patchInputLabels,
} from "./patches/forms";
import { patchHoverContent } from "./patches/hovercontent";
import { patchImgAlt, patchSvgInInteractive } from "./patches/images";
import { cleanKeyboardHandlers, patchKeyboardHandlers } from "./patches/keyboard";
import { patchDocumentTitle, patchHtmlLang, patchSkipLinkTarget } from "./patches/structural";
import { patchTableHeaders } from "./patches/tables";
import { patchAutocomplete } from "./patches/autocomplete";

const routeListeners = new Set<() => void>();

function patchHistoryOnce(): void {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = history as any;
  if (h.__a11yerPatched) return;
  h.__a11yerPatched = true;

  const origPushState = history.pushState.bind(history);
  const origReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    origPushState(...args);
    routeListeners.forEach((fn) => fn());
  };
  history.replaceState = function (
    ...args: Parameters<typeof history.replaceState>
  ) {
    origReplaceState(...args);
    routeListeners.forEach((fn) => fn());
  };
  window.addEventListener("popstate", () => {
    routeListeners.forEach((fn) => fn());
  });
}

function scheduleIdle(fn: () => void, timeoutMs = 100): void {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(fn, { timeout: timeoutMs });
  } else {
    setTimeout(fn, 0);
  }
}

export interface DomScannerOptions {
  config: A11yConfig;
  root?: Element;
}

export class DomScanner {
  private config: A11yConfig;
  private root: Element | null = null;
  private observer: MutationObserver | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private _routeHandler: (() => void) | null = null;
  private hasPendingMutations = false;
  private shadowObservers = new Set<MutationObserver>();

  constructor(options: DomScannerOptions) {
    this.config = options.config;
    if (typeof document !== "undefined") {
      this.root = options.root || document.body;
    }
  }

  start(): void {
    if (typeof document === "undefined" || !this.root) return;
    if (this.started) return;
    this.started = true;

    // Initial scan: ALL patches run synchronously.
    // This ensures the page is accessible from the very first paint.
    this.runAllPatches(this.root);

    // Start observing for future mutations
    this.observer = new MutationObserver(() => {
      this.hasPendingMutations = true;
      this.scheduleFlush();
    });
    this.observer.observe(this.root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "aria-label", "aria-labelledby", "aria-hidden", "role",
        "required", "disabled", "tabindex", "alt", "lang",
        "aria-modal", "aria-expanded", "aria-invalid",
        "aria-selected", "aria-checked", "open", "popover",
      ],
    });

    // SPA route changes
    if (this.config.announceSpaNavigation) {
      patchHistoryOnce();
      const handleRouteChange = () => {
        setTimeout(() => {
          announce(document.title || "Page changed", "polite");
          this.rescan();
        }, 100);
      };
      routeListeners.add(handleRouteChange);
      this._routeHandler = handleRouteChange;
    }
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    for (const obs of this.shadowObservers) obs.disconnect();
    this.shadowObservers.clear();
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this._routeHandler) {
      routeListeners.delete(this._routeHandler);
      this._routeHandler = null;
    }
    this.started = false;
  }

  update(config: A11yConfig): void {
    this.config = config;
    if (this.root) this.runAllPatches(this.root);
  }

  rescan(): void {
    if (this.root) this.runAllPatches(this.root);
  }

  private getContext(): PatchContext {
    return { config: this.config };
  }

  /**
   * Run every patch synchronously. Used for:
   * - Initial scan (must complete before first paint)
   * - rescan() after route change
   * - update() on config change
   */
  private runAllPatches(root: Element): void {
    const ctx = this.getContext();

    // Document-level
    patchHtmlLang(ctx);
    patchDocumentTitle(ctx);

    // Structural
    patchSkipLinkTarget(root);

    // Images
    patchImgAlt(root, ctx);
    patchSvgInInteractive(root, ctx);

    // Tables
    patchTableHeaders(root, ctx);

    // Forms
    patchAriaRequired(root, ctx);
    patchInputLabels(root, ctx);
    patchAriaInvalid(root, ctx);
    cleanAriaInvalid(root);
    patchAutocomplete(root, ctx);

    // Keyboard
    patchKeyboardHandlers(root, ctx);
    cleanKeyboardHandlers(root);

    // Composites
    patchCompositeWidgets(root, ctx);
    cleanCompositeWidgets(root);

    // Dialogs
    patchDialogFocusTrap(root, ctx);
    cleanDialogFocusTraps(root);

    // Hover content
    patchHoverContent(root, ctx);

    // Contrast — the only deferred patch (getComputedStyle is expensive)
    if (ctx.config.autoContrastFix) {
      scheduleIdle(() => {
        if (!this.started) return;
        fixContrastViolations(root, ctx);
      });
    }

    // Shadow DOM + iframes
    this.scanShadowRoots(root);
    this.scanIframes(root);
  }

  /**
   * Mutation flush — debounced to 16ms.
   * Re-runs all patches from root. isPatched() guards prevent redundant work.
   */
  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      if (!this.hasPendingMutations || !this.root) return;
      this.hasPendingMutations = false;
      this.runAllPatches(this.root);
    }, 16);
  }

  private scanShadowRoots(root: Element): void {
    const allElements = root.querySelectorAll("*");
    for (const el of allElements) {
      if (el.shadowRoot && !isPatched(el, "shadow-scanned")) {
        markPatched(el, "shadow-scanned");
        this.runAllPatches(el.shadowRoot as unknown as Element);

        const obs = new MutationObserver(() => this.scheduleFlush());
        obs.observe(el.shadowRoot, {
          childList: true,
          subtree: true,
          attributes: true,
        });
        this.shadowObservers.add(obs);
      }
    }
  }

  private scanIframes(root: Element): void {
    const iframes = root.querySelectorAll<HTMLIFrameElement>("iframe");
    for (const iframe of iframes) {
      if (isPatched(iframe, "iframe-scanned")) continue;
      try {
        const doc = iframe.contentDocument;
        if (!doc?.body) continue;
        markPatched(iframe, "iframe-scanned");
        this.runAllPatches(doc.body);
      } catch {
        markPatched(iframe, "iframe-scanned");
      }
    }
  }
}
