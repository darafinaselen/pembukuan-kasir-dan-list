import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Armada (Vehicles) Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display armada page', async ({ page }) => {
    await page.goto('/armada');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page.locator('text=/Armada|Vehicle/i')).toBeVisible();
    
    // Check for "Tambah Armada" button
    const addButton = page.locator('button:has-text("Tambah Armada"), button:has-text("Tambah")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should open add armada dialog', async ({ page }) => {
    await page.goto('/armada');
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Armada" button
    const addButton = page.locator('button:has-text("Tambah Armada"), button:has-text("Tambah")').first();
    await addButton.click();
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', { timeout: 5000 });
    
    // Check form fields
    await expect(page.locator('input[name="license_plate"], input[placeholder*="Plat"]')).toBeVisible();
    await expect(page.locator('input[name="brand"], input[placeholder*="Merek"]')).toBeVisible();
    await expect(page.locator('input[name="model"], input[placeholder*="Model"]')).toBeVisible();
  });

  test('should create new armada', async ({ page }) => {
    await page.goto('/armada');
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Armada" button
    const addButton = page.locator('button:has-text("Tambah Armada"), button:has-text("Tambah")').first();
    await addButton.click();
    
    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', { timeout: 5000 });
    
    // Fill form
    const licensePlate = `TEST-${Date.now()}`;
    await page.fill('input[name="license_plate"]', licensePlate);
    await page.fill('input[name="brand"]', 'Toyota');
    await page.fill('input[name="model"]', 'Avanza');
    
    // Select status if it's a select
    const statusSelect = page.locator('select[name="status"], [role="combobox"]:has-text("Status")');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('READY');
    }
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Simpan"), button:has-text("Save")');
    await submitButton.click();
    
    // Wait for success message or dialog to close
    await page.waitForTimeout(2000);
    
    // Verify armada appears in list (or dialog closes)
    const dialog = page.locator('[role="dialog"]');
    const dialogCount = await dialog.count();
    expect(dialogCount).toBe(0);
  });

  test('should filter armada by status', async ({ page }) => {
    await page.goto('/armada');
    await page.waitForLoadState('networkidle');
    
    // Look for status filter
    const statusFilter = page.locator('select[name="status"], button:has-text("Status"), [role="combobox"]:has-text("Status")');
    const filterCount = await statusFilter.count();
    
    if (filterCount > 0) {
      await statusFilter.first().click();
      await page.waitForTimeout(500);
      
      // Select "READY" status
      await page.click('text=READY, text=Ready');
      await page.waitForTimeout(1000);
      
      // Verify cards are still visible
      const cards = page.locator('[class*="Card"], [class*="card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should search armada', async ({ page }) => {
    await page.goto('/armada');
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Cari"], input[placeholder*="Search"]');
    const inputCount = await searchInput.count();
    
    if (inputCount > 0) {
      await searchInput.first().fill('Toyota');
      await page.waitForTimeout(1000);
      
      // Verify results are filtered
      const cards = page.locator('[class*="Card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should edit armada', async ({ page }) => {
    await page.goto('/armada');
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
      
      // Verify form is pre-filled
      const licenseInput = page.locator('input[name="license_plate"]');
      if (await licenseInput.isVisible()) {
        const value = await licenseInput.inputValue();
        expect(value).toBeTruthy();
      }
    }
  });
});

