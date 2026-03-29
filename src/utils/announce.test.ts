import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  announce,
  isAnnouncerMounted,
  mountAnnouncer,
  unmountAnnouncer,
} from "./announce";

beforeEach(() => {
  // Ensure a clean slate before each test
  unmountAnnouncer();
});

afterEach(() => {
  unmountAnnouncer();
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe("mountAnnouncer", () => {
  it("creates polite and assertive aria-live regions", () => {
    mountAnnouncer();

    const polite = document.querySelector('[data-a11yer-announcer="polite"]');
    const assertive = document.querySelector('[data-a11yer-announcer="assertive"]');
    expect(polite).not.toBeNull();
    expect(assertive).not.toBeNull();
  });

  it("polite region has aria-live=polite and role=status", () => {
    mountAnnouncer();
    const polite = document.querySelector('[data-a11yer-announcer="polite"]');
    expect(polite?.getAttribute("aria-live")).toBe("polite");
    expect(polite?.getAttribute("role")).toBe("status");
    expect(polite?.getAttribute("aria-atomic")).toBe("true");
  });

  it("assertive region has aria-live=assertive and role=alert", () => {
    mountAnnouncer();
    const assertive = document.querySelector('[data-a11yer-announcer="assertive"]');
    expect(assertive?.getAttribute("aria-live")).toBe("assertive");
    expect(assertive?.getAttribute("role")).toBe("alert");
    expect(assertive?.getAttribute("aria-atomic")).toBe("true");
  });

  it("appends the regions to document.body", () => {
    mountAnnouncer();
    const polite = document.querySelector('[data-a11yer-announcer="polite"]');
    expect(polite?.parentElement).toBe(document.body);
  });

  it("sets isAnnouncerMounted() to true after mounting", () => {
    mountAnnouncer();
    expect(isAnnouncerMounted()).toBe(true);
  });

  it("returns a cleanup function", () => {
    const cleanup = mountAnnouncer();
    expect(typeof cleanup).toBe("function");
    cleanup();
    expect(isAnnouncerMounted()).toBe(false);
  });

  it("does not create duplicate regions if called twice", () => {
    mountAnnouncer();
    mountAnnouncer();

    const politeRegions = document.querySelectorAll('[data-a11yer-announcer="polite"]');
    expect(politeRegions.length).toBe(1);
  });
});

describe("unmountAnnouncer", () => {
  it("removes the aria-live regions from the DOM", () => {
    mountAnnouncer();
    unmountAnnouncer();

    const polite = document.querySelector('[data-a11yer-announcer="polite"]');
    const assertive = document.querySelector('[data-a11yer-announcer="assertive"]');
    expect(polite).toBeNull();
    expect(assertive).toBeNull();
  });

  it("sets isAnnouncerMounted() to false", () => {
    mountAnnouncer();
    unmountAnnouncer();
    expect(isAnnouncerMounted()).toBe(false);
  });

  it("does not throw when called before mounting", () => {
    expect(() => unmountAnnouncer()).not.toThrow();
  });

  it("is idempotent — calling twice does not throw", () => {
    mountAnnouncer();
    unmountAnnouncer();
    expect(() => unmountAnnouncer()).not.toThrow();
  });
});

describe("announce", () => {
  it("auto-mounts the announcer if not already mounted", () => {
    expect(isAnnouncerMounted()).toBe(false);
    vi.useFakeTimers();

    announce("Hello");

    expect(isAnnouncerMounted()).toBe(true);
  });

  it("updates polite region textContent after timeout", () => {
    mountAnnouncer();
    vi.useFakeTimers();

    announce("Navigation completed", "polite");

    const polite = document.querySelector('[data-a11yer-announcer="polite"]');
    // Before the timeout fires, textContent is cleared
    expect(polite?.textContent).toBe("");

    vi.advanceTimersByTime(50);
    expect(polite?.textContent).toBe("Navigation completed");
  });

  it("updates assertive region textContent after timeout", () => {
    mountAnnouncer();
    vi.useFakeTimers();

    announce("Error: form invalid", "assertive");

    const assertive = document.querySelector('[data-a11yer-announcer="assertive"]');
    expect(assertive?.textContent).toBe("");

    vi.advanceTimersByTime(50);
    expect(assertive?.textContent).toBe("Error: form invalid");
  });

  it("defaults to polite priority", () => {
    mountAnnouncer();
    vi.useFakeTimers();

    announce("Default priority message");

    vi.advanceTimersByTime(50);

    const polite = document.querySelector('[data-a11yer-announcer="polite"]');
    const assertive = document.querySelector('[data-a11yer-announcer="assertive"]');

    expect(polite?.textContent).toBe("Default priority message");
    expect(assertive?.textContent).toBe("");
  });

  it("clears the region before setting new content (allows re-announcement)", () => {
    mountAnnouncer();
    vi.useFakeTimers();

    const polite = document.querySelector('[data-a11yer-announcer="polite"]') as HTMLElement;
    polite.textContent = "Old message";

    announce("Same message", "polite");

    // Should be cleared immediately
    expect(polite.textContent).toBe("");

    vi.advanceTimersByTime(50);
    expect(polite.textContent).toBe("Same message");
  });
});
