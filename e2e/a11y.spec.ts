import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("a11yer auto-patches", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);
  });

  test("html[lang] is set", async ({ page }) => {
    const lang = await page.getAttribute("html", "lang");
    expect(lang).toBeTruthy();
  });

  test("skip link exists and targets main", async ({ page }) => {
    const skipLink = page.locator(".a11yer-skip-link");
    await expect(skipLink).toBeAttached();
    const href = await skipLink.getAttribute("href");
    expect(href).toMatch(/^#/);
    const target = page.locator(`${href}`);
    await expect(target).toBeAttached();
  });

  test("img alt derived from filename", async ({ page }) => {
    const alt = await page.locator('img[src="/images/hero-banner.jpg"]').getAttribute("alt");
    expect(alt).toBe("hero banner");
  });

  test("tracking pixel gets empty alt", async ({ page }) => {
    const alt = await page.locator('img[src="/pixel.gif"]').getAttribute("alt");
    expect(alt).toBe("");
  });

  test("email input gets autocomplete", async ({ page }) => {
    expect(await page.locator('input[name="email"]').getAttribute("autocomplete")).toBe("email");
  });

  test("fname input gets autocomplete", async ({ page }) => {
    expect(await page.locator('input[name="fname"]').getAttribute("autocomplete")).toBe("given-name");
  });

  test("required input gets aria-required", async ({ page }) => {
    expect(await page.locator("input[required]").getAttribute("aria-required")).toBe("true");
  });

  test("table th gets scope", async ({ page }) => {
    const ths = page.locator("th");
    for (let i = 0; i < await ths.count(); i++) {
      expect(await ths.nth(i).getAttribute("scope")).toBeTruthy();
    }
  });

  test("div[role=button] gets tabindex=0", async ({ page }) => {
    expect(await page.locator('div[role="button"]').getAttribute("tabindex")).toBe("0");
  });

  test("icon button SVG gets aria-hidden", async ({ page }) => {
    const svg = page.locator('button[title="Close dialog"] svg');
    expect(await svg.getAttribute("aria-hidden")).toBe("true");
  });

  test("tablist children get roving tabindex", async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    expect(await tabs.nth(0).getAttribute("tabindex")).toBe("0");
    expect(await tabs.nth(1).getAttribute("tabindex")).toBe("-1");
  });

  test("focus-visible and reduced-motion CSS injected", async ({ page }) => {
    const css = await page.locator("#a11yer-styles").textContent();
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
  });
});

test.describe("responsive viewports", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 720 },
  ];

  for (const vp of viewports) {
    test(`patches work at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto("/");
      await page.waitForTimeout(300);

      // Core patches should work at all sizes
      expect(await page.getAttribute("html", "lang")).toBeTruthy();
      await expect(page.locator(".a11yer-skip-link")).toBeAttached();
      expect(await page.locator('img[src="/images/hero-banner.jpg"]').getAttribute("alt")).toBe("hero banner");
    });
  }
});

test.describe("axe-core audit", () => {
  test("no serious WCAG violations", async ({ page }) => {
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
      const summary = serious.map((v) => `${v.id} (${v.impact}): ${v.description} [${v.nodes.length} nodes]`);
      console.log("Serious violations:", summary);
    }

    expect(serious).toHaveLength(0);
  });
});
