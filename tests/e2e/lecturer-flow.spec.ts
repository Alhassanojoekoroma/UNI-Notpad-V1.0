import { test, expect } from "@playwright/test";

test.describe("Protected Student/Lecturer Routes", () => {
  test("dashboard redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should redirect to login page or show an unauthorized state
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("content page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/content");

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
