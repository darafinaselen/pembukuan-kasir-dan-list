import { test, expect } from "@playwright/test";

test.describe("Login Feature", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display login form", async ({ page }) => {
    // Check login form elements
    await expect(page.locator("text=Selamat Datang")).toBeVisible();
    await expect(
      page.locator("text=Login ke sistem pembukuan kasir")
    ).toBeVisible();
    await expect(
      page.locator('input[name="email"], input[type="email"]')
    ).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show error for empty fields", async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for validation error
    await page.waitForTimeout(500);

    // Check if form validation prevents submission or shows error
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // HTML5 validation should prevent submission
    const emailRequired = await emailInput.evaluate(
      (el) => el.validity.valueMissing
    );
    const passwordRequired = await passwordInput.evaluate(
      (el) => el.validity.valueMissing
    );

    expect(emailRequired || passwordRequired).toBeTruthy();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const emailInput = page
      .locator('input[name="email"], input[type="email"]')
      .first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await emailInput.fill("invalid@example.com");
    await passwordInput.fill("wrongpassword");
    await submitButton.click();

    // Wait for error message
    await page.waitForTimeout(2000);

    // Check for error message
    const errorMessage = page.locator("text=/Invalid|gagal|error/i");
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    const emailInput = page
      .locator('input[name="email"], input[type="email"]')
      .first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await emailInput.fill(
      process.env.TEST_ADMIN_EMAIL || "admin@pembukuan.com"
    );
    await passwordInput.fill(process.env.TEST_ADMIN_PASSWORD || "Admin123!");
    await submitButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // Verify we're on dashboard - use h1 to be specific
    await expect(page.locator("h1:has-text('Dashboard')")).toBeVisible();

    // Verify sidebar is visible
    await expect(page.locator("text=Master Data")).toBeVisible();
  });

  test("should redirect to login when accessing protected route without auth", async ({
    page,
    context,
  }) => {
    // Clear all cookies and storage to simulate logged out state
    await context.clearCookies();
    await context.clearPermissions();

    // Try to access dashboard without login
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should redirect to login page
    await expect(page).toHaveURL(/\//);
    await expect(page.locator("text=Selamat Datang")).toBeVisible();
  });
});
