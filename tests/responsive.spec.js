import { expect, test } from "@playwright/test";

const viewports = [
  { name: "compact mobile", width: 320, height: 568 },
  { name: "mobile", width: 375, height: 812 },
  { name: "large mobile", width: 430, height: 932 },
  { name: "tablet portrait", width: 768, height: 1024 },
  { name: "tablet landscape", width: 1024, height: 768 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "wide desktop", width: 1920, height: 1080 }
];

for (const viewport of viewports) {
  test(`layout fits and key content is visible at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      contentWidth: document.documentElement.scrollWidth
    }));
    expect(dimensions.contentWidth, "page should not scroll horizontally").toBeLessThanOrEqual(dimensions.viewportWidth);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#services")).toBeVisible();
    await expect(page.locator("#work .project-card")).toHaveCount(3);
    await expect(page.locator("#approach")).toBeVisible();
    await expect(page.locator("#contact-form")).toBeVisible();

    if (viewport.width <= 640) {
      await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
    } else {
      await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    }

    const sectionBounds = await page.locator("main > section").evaluateAll((sections) =>
      sections.map((section) => {
        const bounds = section.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right };
      })
    );
    for (const bounds of sectionBounds) {
      expect(bounds.left, "section should not extend past the left viewport edge").toBeGreaterThanOrEqual(0);
      expect(bounds.right, "section should not extend past the right viewport edge").toBeLessThanOrEqual(dimensions.viewportWidth);
    }
  });
}