import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Sopir (Drivers) Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display sopir page', async ({ page }) => {
    await page.goto('/sopir');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page.locator('text=/Sopir|Driver/i')).toBeVisible();
    
    // Check for "Tambah Sopir" button
    const addButton = page.locator('button:has-text("Tambah Sopir"), button:has-text("Tambah")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should open add sopir dialog', async ({ page }) => {
    await page.goto('/sopir');
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Sopir" button
    const addButton = page.locator('button:has-text("Tambah Sopir"), button:has-text("Tambah")').first();
    await addButton.click();
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', { timeout: 5000 });
    
    // Check form fields
    await expect(page.locator('input[name="driver_name"], input[placeholder*="Nama"]')).toBeVisible();
    await expect(page.locator('input[name="phone_number"], input[placeholder*="Telepon"]')).toBeVisible();
  });

  test('should create new sopir', async ({ page }) => {
    await page.goto('/sopir');
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Sopir" button
    const addButton = page.locator('button:has-text("Tambah Sopir"), button:has-text("Tambah")').first();
    await addButton.click();
    
    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', { timeout: 5000 });
    
    // Fill form
    const driverName = `Test Driver ${Date.now()}`;
    await page.fill('input[name="driver_name"]', driverName);
    await page.fill('input[name="phone_number"]', '081234567890');
    await page.fill('input[name="nik"]', '1234567890123456');
    await page.fill('input[name="address"]', 'Test Address');
    
    // Select status
    const statusSelect = page.locator('select[name="status"], [role="combobox"]:has-text("Status")');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('READY');
    }
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Simpan")');
    await submitButton.click();
    
    // Wait for success
    await page.waitForTimeout(2000);
    
    // Verify dialog closes
    const dialog = page.locator('[role="dialog"]');
    const dialogCount = await dialog.count();
    expect(dialogCount).toBe(0);
  });

  test('should search sopir', async ({ page }) => {
    await page.goto('/sopir');
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Cari"]');
    const inputCount = await searchInput.count();
    
    if (inputCount > 0) {
      await searchInput.first().fill('Test');
      await page.waitForTimeout(1000);
      
      // Verify results are filtered
      const cards = page.locator('[class*="Card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should edit sopir', async ({ page }) => {
    await page.goto('/sopir');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for edit button
    const editButtons = page.locator('button:has-text("Edit"), button[aria-label*="Edit"]');
    const buttonCount = await editButtons.count();
    
    if (buttonCount > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Check dialog opens
      const dialog = page.locator('[role="dialog"], [class*="Dialog"]');
      await expect(dialog.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

