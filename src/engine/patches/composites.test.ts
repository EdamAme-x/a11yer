import { afterEach, describe, expect, it } from "vitest";
import { defaultA11yConfig } from "../../types";
import type { PatchContext } from "../../types";
import { patchCompositeWidgets } from "./composites";

const ctx: PatchContext = { config: defaultA11yConfig };

afterEach(() => {
  document.body.replaceChildren();
});

function buildTablist(...tabLabels: string[]): {
  tablist: HTMLDivElement;
  tabs: HTMLDivElement[];
} {
  const tablist = document.createElement("div");
  tablist.setAttribute("role", "tablist");
  const tabs: HTMLDivElement[] = [];
  for (const label of tabLabels) {
    const tab = document.createElement("div");
    tab.setAttribute("role", "tab");
    tab.textContent = label;
    tablist.appendChild(tab);
    tabs.push(tab);
  }
  document.body.appendChild(tablist);
  return { tablist, tabs };
}

describe("patchCompositeWidgets — tablist", () => {
  it("sets tabindex=0 on the first tab, -1 on the rest", () => {
    const { tabs } = buildTablist("Tab1", "Tab2", "Tab3");
    patchCompositeWidgets(document.body, ctx);

    expect(tabs[0].getAttribute("tabindex")).toBe("0");
    expect(tabs[1].getAttribute("tabindex")).toBe("-1");
    expect(tabs[2].getAttribute("tabindex")).toBe("-1");
  });

  it("gives tabindex=0 to the aria-selected tab when one is selected", () => {
    const { tabs } = buildTablist("Tab1", "Tab2", "Tab3");
    tabs[1].setAttribute("aria-selected", "true");
    patchCompositeWidgets(document.body, ctx);

    expect(tabs[0].getAttribute("tabindex")).toBe("-1");
    expect(tabs[1].getAttribute("tabindex")).toBe("0");
    expect(tabs[2].getAttribute("tabindex")).toBe("-1");
  });

  it("marks the tablist as patched", () => {
    const { tablist } = buildTablist("A", "B");
    patchCompositeWidgets(document.body, ctx);
    expect(tablist.hasAttribute("data-a11yer-roving")).toBe(true);
  });

  it("does not double-patch a tablist", () => {
    const { tabs } = buildTablist("Tab1", "Tab2");
    patchCompositeWidgets(document.body, ctx);

    // Manually change a tabindex and re-run; should not be overwritten
    tabs[1].setAttribute("tabindex", "0");
    patchCompositeWidgets(document.body, ctx);
    expect(tabs[1].getAttribute("tabindex")).toBe("0");
  });

  it("skips library-managed composites", () => {
    const tablist = document.createElement("div");
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("data-headlessui-state", "open");
    const tab = document.createElement("div");
    tab.setAttribute("role", "tab");
    tablist.appendChild(tab);
    document.body.appendChild(tablist);

    patchCompositeWidgets(document.body, ctx);
    // tabindex should NOT have been set by the patcher on a library-managed element
    expect(tab.hasAttribute("tabindex")).toBe(false);
    // The tablist itself should be marked as patched (skipped)
    expect(tablist.hasAttribute("data-a11yer-roving")).toBe(true);
  });

  it("only includes direct children tabs, not nested sub-tablist tabs", () => {
    const outerTablist = document.createElement("div");
    outerTablist.setAttribute("role", "tablist");

    const tab1 = document.createElement("div");
    tab1.setAttribute("role", "tab");
    tab1.textContent = "Outer Tab 1";

    const innerTablist = document.createElement("div");
    innerTablist.setAttribute("role", "tablist");
    const innerTab = document.createElement("div");
    innerTab.setAttribute("role", "tab");
    innerTab.textContent = "Inner Tab";
    innerTablist.appendChild(innerTab);

    outerTablist.append(tab1, innerTablist);
    document.body.appendChild(outerTablist);

    patchCompositeWidgets(document.body, ctx);

    // The outer tablist should only manage tab1 (direct child).
    // innerTab's closest composite is innerTablist, not outerTablist.
    expect(tab1.getAttribute("tabindex")).toBe("0");
    // innerTab is managed by the innerTablist — it should also get tabindex set by
    // the inner composite patch, but NOT by the outer one.
    // The key assertion: outerTablist didn't give innerTab tabindex="-1" as part of
    // its own roving set (tab1 got "0", no tab from inner list got "-1" from outer).
    // Both should end up with a tabindex set (inner tab gets 0 from its own list).
    expect(innerTab.getAttribute("tabindex")).toBe("0");
  });
});

describe("patchCompositeWidgets — radiogroup", () => {
  it("sets roving tabindex on role=radiogroup with radio children", () => {
    const group = document.createElement("div");
    group.setAttribute("role", "radiogroup");
    const r1 = document.createElement("div");
    r1.setAttribute("role", "radio");
    const r2 = document.createElement("div");
    r2.setAttribute("role", "radio");
    group.append(r1, r2);
    document.body.appendChild(group);

    patchCompositeWidgets(document.body, ctx);
    expect(r1.getAttribute("tabindex")).toBe("0");
    expect(r2.getAttribute("tabindex")).toBe("-1");
  });
});
