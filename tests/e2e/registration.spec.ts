import { test, expect } from "@playwright/test";

test.describe("Registration Page", () => {
  test("should display the registration form", async ({ page }) => {
    await page.goto("/register");

    // Verify the page loaded with a registration heading
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();

    // Verify essential form fields are present
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();

    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  });

  test("should prevent an incomplete first step", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await expect(page).toHaveURL(/\/register/);
  });

  test("student academic dropdowns load and stay in sync", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Full Name").fill("Test Student");
    await page.getByLabel("Email").fill("dropdown-test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("Password123!");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: /Student Browse materials/i }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();

    const faculty = page.getByRole("combobox", { name: "Faculty" });
    const semester = page.getByRole("combobox", { name: "Semester" });
    const program = page.getByRole("combobox", { name: "Program" });

    await expect(faculty).toBeEnabled();
    await faculty.click();
    await page.getByRole("option").first().click();

    await expect(program).toBeEnabled();
    await program.click();
    await page.getByRole("option").first().click();

    await semester.click();
    await page.getByRole("option", { name: "Semester 1" }).click();
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
  });

  test("should have a link to the login page", async ({ page }) => {
    await page.goto("/register");

    const loginLink = page.locator('a[href*="/login"]');
    await expect(loginLink).toBeVisible();

    await loginLink.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
