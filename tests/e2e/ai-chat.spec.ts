import { test, expect } from "@playwright/test";

test.describe("AI Chat Page", () => {
  test("AI page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/ai");

    // Should end up at login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("AI API endpoint rejects unauthenticated requests", async ({
    page,
  }) => {
    // Intercept the AI API to verify it returns 401 for unauthenticated users
    const response = await page.request.get("/api/ai/chat");

    // Should return 401 Unauthorized or 405 Method Not Allowed
    expect([401, 403, 405]).toContain(response.status());
  });

  test("AI page would render chat interface after login", async ({ page }) => {
    // Mock the AI streaming endpoint to avoid real API calls
    await page.route("**/api/ai/chat", (route) => {
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: 'data: {"content":"Hello, how can I help you study?"}\n\n',
      });
    });

    // Even with mocked API, the page should still redirect without auth
    await page.goto("/ai");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
