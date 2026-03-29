"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { DomScanner } from "../engine/DomScanner";
import { StyleInjector } from "../engine/StyleInjector";
import type { A11yerConfig } from "../types";
import { defaultA11yConfig } from "../types";
import { mountAnnouncer } from "../utils/announce";
import {
  getReducedMotionServerSnapshot,
  getReducedMotionSnapshot,
  subscribeToReducedMotion,
} from "../utils/mediaQuery";
import { SkipLink } from "./SkipLink";

export interface A11yerProps {
  children: ReactNode;
  config?: A11yerConfig;
}

/**
 * Wrap your app in <A11yer> and accessibility is automatically handled.
 * No hooks to call, no props to spread, no components to replace.
 */
export function A11yer({ children, config }: A11yerProps) {
  const a11y = useMemo(
    () => ({ ...defaultA11yConfig, ...config?.a11y }),
    [config?.a11y],
  );

  const browserPrefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const prefersReducedMotion = useMemo(() => {
    if (a11y.reducedMotion === "always") return true;
    if (a11y.reducedMotion === "never") return false;
    return browserPrefersReducedMotion;
  }, [a11y.reducedMotion, browserPrefersReducedMotion]);

  // Style injection
  const styleInjectorRef = useRef(new StyleInjector());

  useEffect(() => {
    const injector = styleInjectorRef.current;
    injector.inject({
      focusVisible: a11y.focusVisible,
      focusStyle: a11y.focusStyle,
      reducedMotion: prefersReducedMotion,
    });
    return () => injector.remove();
  }, [a11y.focusVisible, a11y.focusStyle, prefersReducedMotion]);

  // DOM scanner
  const scannerRef = useRef<DomScanner | null>(null);

  useEffect(() => {
    const scanner = new DomScanner({ config: a11y });
    scanner.start();
    scannerRef.current = scanner;
    return () => scanner.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scannerRef.current?.update(a11y);
  }, [a11y]);

  // Announcer (for SPA route changes)
  useEffect(() => {
    return mountAnnouncer();
  }, []);

  return (
    <>
      <SkipLink />
      {children}
    </>
  );
}
