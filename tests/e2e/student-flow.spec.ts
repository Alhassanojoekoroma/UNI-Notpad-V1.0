import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("landing page loads with university branding", async ({ page }) => {
    await page.goto("/");

    // Verify the page loaded successfully (200 status implied by no error)
    await expect(page).toHaveURL("/");

    // Check for branding elements — heading or logo should be visible
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    // Page should contain some recognizable branding or call-to-action
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("login page displays the login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login/);

    // Verify login form elements are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("terms of service page renders content", async ({ page }) => {
    await page.goto("/terms");

    await expect(page).toHaveURL(/\/terms/);

    // Verify there is a heading related to terms
    await expect(
      page
        .locator("h1, h2")
        .filter({ hasText: /terms|service|agreement/i })
    ).toBeVisible();

    // Verify substantial content is rendered (not an empty page)
    const paragraphs = page.locator("p");
    const count = await paragraphs.count();
    expect(count).toBeGreaterThan(0);
  });

  test("privacy policy page renders content", async ({ page }) => {
    await page.goto("/privacy");

    await expect(page).toHaveURL(/\/privacy/);

    // Verify there is a heading related to privacy
    await expect(
      page
        .locator("h1, h2")
        .filter({ hasText: /privacy|policy|data/i })
    ).toBeVisible();

    // Verify content is present
    const paragraphs = page.locator("p");
    const count = await paragraphs.count();
    expect(count).toBeGreaterThan(0);
  });
});
