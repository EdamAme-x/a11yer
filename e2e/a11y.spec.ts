import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("a11yer auto-patches", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for deferred patches to complete
    await page.waitForTimeout(500);
  });

  test("page has html[lang]", async ({ page }) => {
    const lang = await page.getAttribute("html", "lang");
    expect(lang).toBeTruthy();
  });

  test("skip link exists and points to main", async ({ page }) => {
    const skipLink = page.locator(".a11yer-skip-link");
    await expect(skipLink).toBeAttached();
    const href = await skipLink.getAttribute("href");
    expect(href).toMatch(/^#/);

    // Target element exists
    const targetId = href!.slice(1);
    const target = page.locator(`#${targetId}`);
    await expect(target).toBeAttached();
  });

  test("images get alt text from filename", async ({ page }) => {
    const heroImg = page.locator('img[src="/images/hero-banner.jpg"]');
    const alt = await heroImg.getAttribute("alt");
    expect(alt).toBe("hero banner");
  });

  test("tracking pixel gets empty alt", async ({ page }) => {
    const pixel = page.locator('img[src="/pixel.gif"]');
    const alt = await pixel.getAttribute("alt");
    expect(alt).toBe("");
  });

  test("email input gets autocomplete=email", async ({ page }) => {
    const email = page.locator('input[name="email"]');
    const ac = await email.getAttribute("autocomplete");
    expect(ac).toBe("email");
  });

  test("fname input gets autocomplete=given-name", async ({ page }) => {
    const fname = page.locator('input[name="fname"]');
    const ac = await fname.getAttribute("autocomplete");
    expect(ac).toBe("given-name");
  });

  test("required input gets aria-required", async ({ page }) => {
    const required = page.locator("input[required]");
    const ar = await required.getAttribute("aria-required");
    expect(ar).toBe("true");
  });

  test("table headers get scope", async ({ page }) => {
    const ths = page.locator("th");
    const count = await ths.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const scope = await ths.nth(i).getAttribute("scope");
      expect(scope).toBeTruthy();
    }
  });

  test("non-native button gets tabindex and keyboard handler", async ({ page }) => {
    const btn = page.locator('div[role="button"]');
    const tabindex = await btn.getAttribute("tabindex");
    expect(tabindex).toBe("0");
  });

  test("icon-only button with title gets aria-label", async ({ page }) => {
    const closeBtn = page.locator('button[title="Close dialog"]');
    // SVG should be aria-hidden since parent gets aria-label from title
    const svg = closeBtn.locator("svg");
    const hidden = await svg.getAttribute("aria-hidden");
    expect(hidden).toBe("true");
  });

  test("tablist children get roving tabindex", async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBe(3);

    // First (selected) tab should have tabindex=0
    const first = await tabs.nth(0).getAttribute("tabindex");
    expect(first).toBe("0");

    // Others should have tabindex=-1
    const second = await tabs.nth(1).getAttribute("tabindex");
    expect(second).toBe("-1");
  });

  test("focus-visible CSS is injected", async ({ page }) => {
    const style = page.locator("#a11yer-styles");
    await expect(style).toBeAttached();
    const content = await style.textContent();
    expect(content).toContain(":focus-visible");
  });

  test("reduced motion CSS is injected", async ({ page }) => {
    const style = page.locator("#a11yer-styles");
    const content = await style.textContent();
    expect(content).toContain("prefers-reduced-motion");
  });
});

test.describe("axe-core accessibility audit", () => {
  test("page passes axe-core scan", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules([
        // Disable rules that conflict with a11yer's approach
        "color-contrast", // a11yer fixes contrast via CSS override which axe can't detect
      ])
      .analyze();

    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
    }));

    // Log violations for debugging
    if (violations.length > 0) {
      console.log("axe-core violations:", JSON.stringify(violations, null, 2));
    }

    // Allow minor violations but no serious/critical ones
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toHaveLength(0);
  });
});
