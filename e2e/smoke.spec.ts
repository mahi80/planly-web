/**
 * Smoke test — login, search, open a result, verify the detail page renders.
 *
 * Requires the Next.js dev server + planly API to be running locally.
 * Provide credentials via TEST_EMAIL + TEST_PASSWORD env vars.
 */
import { expect, test } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL ?? "demo@planly.local";
const PASSWORD = process.env.TEST_PASSWORD ?? "demo-password";

test("login → search → open result → detail renders", async ({ page }) => {
  // Log in.
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Land on /search after auth.
  await expect(page).toHaveURL(/\/search/, { timeout: 10_000 });
  await expect(
    page.getByRole("heading", { name: /search planning applications/i }),
  ).toBeVisible();

  // Click the first result card → /applications/[id].
  const firstResultLink = page.locator("a[href^='/applications/']").first();
  await expect(firstResultLink).toBeVisible({ timeout: 10_000 });
  await firstResultLink.click();

  // Detail page renders the reference + sections.
  await expect(page).toHaveURL(/\/applications\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /draft letter/i }),
  ).toBeVisible();
});
