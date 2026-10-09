import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows the Dennis Digital brand and primary page content", async ({ page }) => {
  await expect(page).toHaveTitle(/Dennis Digital/);
  await expect(page.getByRole("link", { name: "Dennis Digital, home" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("good website");
  await expect(page.locator("#services .service-item")).toHaveCount(4);
  await expect(page.locator("#work .project-card")).toHaveCount(3);
  await expect(page.getByText("CONCEPT PROJECT").first()).toBeVisible();
});

test("all in-page links point to an existing section", async ({ page }) => {
  const missingTargets = await page.locator('a[href^="#"]').evaluateAll((links) =>
    links
      .map((link) => link.getAttribute("href").slice(1))
      .filter((target) => target && !document.getElementById(target))
  );

  expect(missingTargets).toEqual([]);
});

test("mobile navigation opens and closes after choosing a section", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const menuButton = page.locator(".menu-toggle");

  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/#services$/);
  await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
});

test("enquiry form validates input and explains missing email configuration", async ({ page }) => {
  const name = page.getByLabel("Your name");
  const email = page.getByLabel("Email address");
  const business = page.getByLabel("What kind of business do you run?");
  const message = page.getByLabel("What would you like your website to do?");

  await page.getByRole("button", { name: "Send project enquiry" }).click();
  await expect(name).toHaveJSProperty("validity.valueMissing", true);

  await name.fill("Test Customer");
  await email.fill("not-an-email");
  await business.fill("Electrician");
  await message.fill("I need a new website.");
  await page.getByRole("button", { name: "Send project enquiry" }).click();
  await expect(email).toHaveJSProperty("validity.typeMismatch", true);

  await email.fill("customer@example.test");
  await page.getByRole("button", { name: "Send project enquiry" }).click();
  await expect(page.locator("#form-status")).toContainText("contactEmail in js/script.js");
});

test("hero and portfolio photos load and have alternative text", async ({ page }) => {
  for (const image of await page.locator(".hero-visual img, .project-image img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty("complete", true);
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
    await expect(image).toHaveAttribute("alt", /.+/);
  }
});