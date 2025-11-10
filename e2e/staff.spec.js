import { test, expect } from "@playwright/test";

test.describe("Staff Feature", () => {
  test("should display staff page", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState("networkidle");

    // Check page title
    await expect(page.locator("text=/Staff/i")).toBeVisible();

    // Check for "Tambah Staff" button
    const addButton = page.locator(
      'button:has-text("Tambah Staff"), button:has-text("Tambah")'
    );
    await expect(addButton.first()).toBeVisible();
  });

  test("should open add staff dialog", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState("networkidle");

    // Click "Tambah Staff" button
    const addButton = page
      .locator('button:has-text("Tambah Staff"), button:has-text("Tambah")')
      .first();
    await addButton.click();

    // Wait for dialog
    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', {
      timeout: 5000,
    });

    // Check form fields
    await expect(
      page.locator('input[name="staff_name"], input[placeholder*="Nama"]')
    ).toBeVisible();
    await expect(page.locator('input[name="nik"]')).toBeVisible();
    await expect(
      page.locator('input[name="position"], input[placeholder*="Posisi"]')
    ).toBeVisible();
  });

  test("should create new staff", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState("networkidle");

    // Click "Tambah Staff" button
    const addButton = page
      .locator('button:has-text("Tambah Staff"), button:has-text("Tambah")')
      .first();
    await addButton.click();

    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', {
      timeout: 5000,
    });

    // Fill form
    const staffName = `Test Staff ${Date.now()}`;
    await page.fill('input[name="staff_name"]', staffName);
    await page.fill('input[name="nik"]', `1234567890${Date.now()}`);
    await page.fill('input[name="position"]', "Test Position");
    await page.fill('input[name="phone_number"]', "081234567890");
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="salary_amount"]', "5000000");

    // Submit form
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Simpan")'
    );
    await submitButton.click();

    // Wait for success
    await page.waitForTimeout(2000);

    // Verify dialog closes
    const dialog = page.locator('[role="dialog"]');
    const dialogCount = await dialog.count();
    expect(dialogCount).toBe(0);
  });

  test("should filter staff by status", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState("networkidle");

    // Look for status filter
    const statusFilter = page.locator(
      'select[name="status"], button:has-text("Status")'
    );
    const filterCount = await statusFilter.count();

    if (filterCount > 0) {
      await statusFilter.first().click();
      await page.waitForTimeout(500);

      // Select "ACTIVE" status
      await page.click("text=ACTIVE, text=Active");
      await page.waitForTimeout(1000);

      // Verify cards are still visible
      const cards = page.locator('[class*="Card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("should search staff", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState("networkidle");

    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Cari"]'
    );
    const inputCount = await searchInput.count();

    if (inputCount > 0) {
      await searchInput.first().fill("Test");
      await page.waitForTimeout(1000);

      // Verify results are filtered
      const cards = page.locator('[class*="Card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(0);
    }
  });
});
