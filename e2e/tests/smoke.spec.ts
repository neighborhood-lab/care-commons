import { test, expect } from "@playwright/test";

// Critical path smoke tests - must pass after every deployment

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Care Commons/);
});

test("health check returns 200", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.status()).toBe(200);
});

test("login page accessible", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test("API responds correctly", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe("ok");
});

test("database connection working", async ({ request }) => {
  const response = await request.get("/health/detailed");
  const body = await response.json();
  expect(body.checks.database).toBe("healthy");
});
