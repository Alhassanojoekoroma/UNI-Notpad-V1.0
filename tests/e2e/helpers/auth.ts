import { Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for navigation away from login
  await page.waitForURL(/\/(dashboard|_admin|_lecturer)/, { timeout: 10000 });
}
