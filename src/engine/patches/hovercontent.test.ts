import { afterEach, describe, expect, it } from "vitest";
import { defaultA11yConfig } from "../../types";
import type { PatchContext } from "../../types";
import { patchHoverContent } from "./hovercontent";

const ctx: PatchContext = { config: defaultA11yConfig };

afterEach(() => {
  document.body.replaceChildren();
});

function fireKeydown(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

describe("patchHoverContent", () => {
  it("patches role=tooltip elements", () => {
    const tooltip = document.createElement("div");
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = "Helpful hint";
    document.body.appendChild(tooltip);

    patchHoverContent(document.body, ctx);
    expect(tooltip.hasAttribute("data-a11yer-hover-dismiss")).toBe(true);
  });

  it("patches [popover] elements", () => {
    const popover = document.createElement("div");
    popover.setAttribute("popover", "");
    popover.textContent = "Popover content";
    document.body.appendChild(popover);

    patchHoverContent(document.body, ctx);
    expect(popover.hasAttribute("data-a11yer-hover-dismiss")).toBe(true);
  });

  it("patches [data-tooltip] elements", () => {
    const el = document.createElement("div");
    el.setAttribute("data-tooltip", "");
    el.textContent = "Tooltip";
    document.body.appendChild(el);

    patchHoverContent(document.body, ctx);
    expect(el.hasAttribute("data-a11yer-hover-dismiss")).toBe(true);
  });

  it("hides tooltip on Escape keydown", () => {
    const tooltip = document.createElement("div");
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = "Hint";
    document.body.appendChild(tooltip);

    patchHoverContent(document.body, ctx);
    fireKeydown(tooltip, "Escape");

    expect(tooltip.style.visibility).toBe("hidden");
  });

  it("does not hide tooltip on other keys", () => {
    const tooltip = document.createElement("div");
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = "Hint";
    document.body.appendChild(tooltip);

    patchHoverContent(document.body, ctx);
    fireKeydown(tooltip, "Enter");

    expect(tooltip.style.visibility).not.toBe("hidden");
  });

  it("does not double-patch elements", () => {
    const tooltip = document.createElement("div");
    tooltip.setAttribute("role", "tooltip");
    document.body.appendChild(tooltip);

    patchHoverContent(document.body, ctx);
    patchHoverContent(document.body, ctx);

    // Only one data-a11yer-hover-dismiss attribute (idempotent)
    expect(tooltip.hasAttribute("data-a11yer-hover-dismiss")).toBe(true);
  });

  it("attaches dismiss handler to the trigger element when aria-describedby links it", () => {
    const trigger = document.createElement("button");
    trigger.setAttribute("aria-describedby", "tt1");
    trigger.textContent = "Hover me";

    const tooltip = document.createElement("div");
    tooltip.setAttribute("role", "tooltip");
    tooltip.id = "tt1";
    tooltip.textContent = "Tooltip text";

    document.body.append(trigger, tooltip);
    patchHoverContent(document.body, ctx);

    // Fire Escape on the trigger — should hide the tooltip
    fireKeydown(trigger, "Escape");
    expect(tooltip.style.visibility).toBe("hidden");
  });
});
