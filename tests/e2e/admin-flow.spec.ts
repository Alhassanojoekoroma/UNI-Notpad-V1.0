import { test, expect } from "@playwright/test";

test.describe("Admin Protected Routes", () => {
  test("admin dashboard redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/_admin/dashboard");

    // Should redirect to login page since user is not authenticated
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("admin users page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/_admin/users");

    // Should redirect to login page since user is not authenticated
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
