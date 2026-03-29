import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Wait for a11yer to finish patching by checking for its style element
async function waitForA11yer(page: import("@playwright/test").Page) {
  await page.goto("/");
  // <style> is not visible — use state: "attached"
  await page.waitForSelector("#a11yer-styles", { state: "attached", timeout: 10000 });
}

test("structural + images + forms", async ({ page }) => {
  await waitForA11yer(page);

  expect(await page.getAttribute("html", "lang")).toBeTruthy();

  const skipLink = page.locator(".a11yer-skip-link");
  await expect(skipLink).toBeAttached();
  await expect(page.locator(`${await skipLink.getAttribute("href")}`)).toBeAttached();

  expect(await page.locator('img[src="/images/hero-banner.jpg"]').getAttribute("alt")).toBe("Hero Banner");
  expect(await page.locator('img[src="/pixel.gif"]').getAttribute("alt")).toBe("");

  expect(await page.locator('input[name="email"]').getAttribute("autocomplete")).toBe("email");
  expect(await page.locator('input[name="fname"]').getAttribute("autocomplete")).toBe("given-name");
  expect(await page.locator("input[required]").getAttribute("aria-required")).toBe("true");
});

test("tables + keyboard + composites + CSS", async ({ page }) => {
  await waitForA11yer(page);

  const ths = page.locator("th");
  for (let i = 0; i < await ths.count(); i++) {
    expect(await ths.nth(i).getAttribute("scope")).toBeTruthy();
  }

  expect(await page.locator('div[role="button"]').getAttribute("tabindex")).toBe("0");
  expect(await page.locator('button[title="Close dialog"] svg').getAttribute("aria-hidden")).toBe("true");

  expect(await page.locator('[role="tab"]').nth(0).getAttribute("tabindex")).toBe("0");
  expect(await page.locator('[role="tab"]').nth(1).getAttribute("tabindex")).toBe("-1");

  const css = await page.locator("#a11yer-styles").textContent();
  expect(css).toContain(":focus-visible");
  expect(css).toContain("prefers-reduced-motion");
});

test("responsive viewports", async ({ page }) => {
  for (const [w, h] of [[375, 812], [768, 1024], [1280, 720]]) {
    await page.setViewportSize({ width: w, height: h });
    await waitForA11yer(page);
    expect(await page.getAttribute("html", "lang")).toBeTruthy();
    await expect(page.locator(".a11yer-skip-link")).toBeAttached();
  }
});

test("axe-core WCAG audit", async ({ page }) => {
  await waitForA11yer(page);

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules(["color-contrast"])
    .analyze();

  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (serious.length > 0) console.log(serious.map((v) => `${v.id}: ${v.description}`));
  expect(serious).toHaveLength(0);
});
