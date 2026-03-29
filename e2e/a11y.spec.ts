import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// All tests run in parallel within each browser
test.describe.configure({ mode: "parallel" });

test.describe("auto-patches", () => {
  test("structural: html[lang], skip link, img alt, autocomplete, aria-required", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);

    // html[lang]
    expect(await page.getAttribute("html", "lang")).toBeTruthy();

    // skip link
    const skipLink = page.locator(".a11yer-skip-link");
    await expect(skipLink).toBeAttached();
    const href = await skipLink.getAttribute("href");
    expect(href).toMatch(/^#/);
    await expect(page.locator(`${href}`)).toBeAttached();

    // img alt from filename
    expect(await page.locator('img[src="/images/hero-banner.jpg"]').getAttribute("alt")).toBe("hero banner");

    // tracking pixel
    expect(await page.locator('img[src="/pixel.gif"]').getAttribute("alt")).toBe("");

    // autocomplete
    expect(await page.locator('input[name="email"]').getAttribute("autocomplete")).toBe("email");
    expect(await page.locator('input[name="fname"]').getAttribute("autocomplete")).toBe("given-name");

    // aria-required
    expect(await page.locator("input[required]").getAttribute("aria-required")).toBe("true");
  });

  test("tables, keyboard, composites, CSS", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);

    // table scope
    const ths = page.locator("th");
    for (let i = 0; i < await ths.count(); i++) {
      expect(await ths.nth(i).getAttribute("scope")).toBeTruthy();
    }

    // div[role=button] tabindex
    expect(await page.locator('div[role="button"]').getAttribute("tabindex")).toBe("0");

    // icon button SVG aria-hidden
    expect(await page.locator('button[title="Close dialog"] svg').getAttribute("aria-hidden")).toBe("true");

    // roving tabindex
    const tabs = page.locator('[role="tab"]');
    expect(await tabs.nth(0).getAttribute("tabindex")).toBe("0");
    expect(await tabs.nth(1).getAttribute("tabindex")).toBe("-1");

    // CSS injection
    const css = await page.locator("#a11yer-styles").textContent();
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
  });

  test("viewports: mobile 375, tablet 768, desktop 1280", async ({ page }) => {
    for (const vp of [
      { w: 375, h: 812 },
      { w: 768, h: 1024 },
      { w: 1280, h: 720 },
    ]) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto("/");
      await page.waitForTimeout(200);

      expect(await page.getAttribute("html", "lang")).toBeTruthy();
      await expect(page.locator(".a11yer-skip-link")).toBeAttached();
      expect(await page.locator('img[src="/images/hero-banner.jpg"]').getAttribute("alt")).toBe("hero banner");
    }
  });

  test("axe-core: no serious WCAG violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    if (serious.length > 0) {
      console.log("Violations:", serious.map((v) => `${v.id}: ${v.description} (${v.nodes.length})`));
    }
    expect(serious).toHaveLength(0);
  });
});
