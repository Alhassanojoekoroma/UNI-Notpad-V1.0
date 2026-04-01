import { test, expect } from "@playwright/test";

test.describe("Registration Page", () => {
  test("should display the registration form", async ({ page }) => {
    await page.goto("/register");

    // Verify the page loaded with a registration heading
    await expect(
      page.locator("h1, h2, h3").filter({ hasText: /register|sign up|create/i })
    ).toBeVisible();

    // Verify essential form fields are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Verify a submit button exists
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show validation errors on empty submit", async ({ page }) => {
    await page.goto("/register");

    // Click submit without filling any fields
    await page.click('button[type="submit"]');

    // The page should still be on the register URL (not navigated away)
    await expect(page).toHaveURL(/\/register/);

    // There should be some form of validation feedback visible
    // (error messages, invalid field indicators, or aria-invalid attributes)
    const hasValidationErrors = await page
      .locator(
        '[role="alert"], .error, [aria-invalid="true"], .text-red-500, .text-destructive'
      )
      .count();
    expect(hasValidationErrors).toBeGreaterThan(0);
  });

  test("should have a link to the login page", async ({ page }) => {
    await page.goto("/register");

    const loginLink = page.locator('a[href*="/login"]');
    await expect(loginLink).toBeVisible();

    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
