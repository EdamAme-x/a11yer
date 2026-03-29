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

/**
 * Schedule a callback via requestIdleCallback with a timeout fallback.
 */
function scheduleIdle(fn: () => void, timeoutMs = 50): void {
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

    // Phase 1: Critical patches — synchronous, minimal work
    this.runDocumentPatches();
    this.runCriticalPatches(this.root);

    // Phase 2: Deferred patches — split into idle callbacks
    const root = this.root;
    const ctx = this.getContext();
    this.scheduleDeferredPatches(root, ctx);

    // Start observing
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

    // SPA route change detection
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
    if (this.root) {
      this.runCriticalPatches(this.root);
      this.scheduleDeferredPatches(this.root, this.getContext());
    }
  }

  rescan(): void {
    if (!this.root) return;
    this.runDocumentPatches();
    this.runCriticalPatches(this.root);
    this.scheduleDeferredPatches(this.root, this.getContext());
  }

  private getContext(): PatchContext {
    return { config: this.config };
  }

  private runDocumentPatches(): void {
    const ctx = this.getContext();
    patchHtmlLang(ctx);
    patchDocumentTitle(ctx);
  }

  /**
   * Critical patches — run synchronously on initial render.
   * These are fast and affect visible a11y immediately.
   */
  private runCriticalPatches(root: Element): void {
    const ctx = this.getContext();
    patchSkipLinkTarget(root);
    patchImgAlt(root, ctx);
    patchSvgInInteractive(root, ctx);
    patchAriaRequired(root, ctx);
  }

  /**
   * Deferred patches — split across multiple idle callbacks
   * to avoid blocking the main thread on large DOMs.
   */
  private scheduleDeferredPatches(root: Element, ctx: PatchContext): void {
    // Batch 1: Forms
    scheduleIdle(() => {
      if (!this.started) return;
      patchInputLabels(root, ctx);
      patchAriaInvalid(root, ctx);
      cleanAriaInvalid(root);
      patchAutocomplete(root, ctx);
    });

    // Batch 2: Keyboard + tables
    scheduleIdle(() => {
      if (!this.started) return;
      patchKeyboardHandlers(root, ctx);
      cleanKeyboardHandlers(root);
      patchTableHeaders(root, ctx);
    });

    // Batch 3: Composite widgets + dialogs
    scheduleIdle(() => {
      if (!this.started) return;
      patchCompositeWidgets(root, ctx);
      cleanCompositeWidgets(root);
      patchDialogFocusTrap(root, ctx);
      cleanDialogFocusTraps(root);
      patchHoverContent(root, ctx);
    });

    // Batch 4: Heavy — contrast, shadow DOM, iframes
    scheduleIdle(() => {
      if (!this.started) return;
      if (ctx.config.autoContrastFix) {
        fixContrastViolations(root, ctx);
      }
      this.scanShadowRoots(root);
      this.scanIframes(root);
    }, 200);
  }

  /**
   * Mutation flush — runs all patches (critical sync + deferred).
   * After initial render, mutations are typically small so full scan is fast.
   */
  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      if (!this.hasPendingMutations || !this.root) return;
      this.hasPendingMutations = false;

      const root = this.root;
      const ctx = this.getContext();

      // On mutation flushes, run everything but still defer heavy work
      this.runCriticalPatches(root);
      scheduleIdle(() => {
        if (!this.started) return;
        patchInputLabels(root, ctx);
        patchAriaInvalid(root, ctx);
        cleanAriaInvalid(root);
        patchAutocomplete(root, ctx);
        patchKeyboardHandlers(root, ctx);
        cleanKeyboardHandlers(root);
        patchTableHeaders(root, ctx);
        patchCompositeWidgets(root, ctx);
        cleanCompositeWidgets(root);
        patchDialogFocusTrap(root, ctx);
        cleanDialogFocusTraps(root);
        patchHoverContent(root, ctx);
      });
      scheduleIdle(() => {
        if (!this.started) return;
        if (ctx.config.autoContrastFix) fixContrastViolations(root, ctx);
        this.scanShadowRoots(root);
        this.scanIframes(root);
      }, 200);
    }, 16);
  }

  private scanShadowRoots(root: Element): void {
    const allElements = root.querySelectorAll("*");
    for (const el of allElements) {
      if (el.shadowRoot && !isPatched(el, "shadow-scanned")) {
        markPatched(el, "shadow-scanned");
        const ctx = this.getContext();
        this.runCriticalPatches(el.shadowRoot as unknown as Element);
        this.scheduleDeferredPatches(el.shadowRoot as unknown as Element, ctx);

        const shadowObserver = new MutationObserver(() =>
          this.scheduleFlush(),
        );
        shadowObserver.observe(el.shadowRoot, {
          childList: true,
          subtree: true,
          attributes: true,
        });
        this.shadowObservers.add(shadowObserver);
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
        const ctx = this.getContext();
        this.runCriticalPatches(doc.body);
        this.scheduleDeferredPatches(doc.body, ctx);
      } catch {
        markPatched(iframe, "iframe-scanned");
      }
    }
  }
}
