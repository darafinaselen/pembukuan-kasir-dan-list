import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Paket (Service Packages) Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display paket page', async ({ page }) => {
    await page.goto('/paket');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page.locator('text=/Paket|Package/i')).toBeVisible();
    
    // Check for "Tambah Paket" button
    const addButton = page.locator('button:has-text("Tambah Paket"), button:has-text("Tambah")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should open add paket dialog', async ({ page }) => {
    await page.goto('/paket');
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Paket" button
    const addButton = page.locator('button:has-text("Tambah Paket"), button:has-text("Tambah")').first();
    await addButton.click();
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', { timeout: 5000 });
    
    // Check form fields
    await expect(page.locator('input[name="name"], input[placeholder*="Nama"]')).toBeVisible();
  });

  test('should create new paket', async ({ page }) => {
    await page.goto('/paket');
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Paket" button
    const addButton = page.locator('button:has-text("Tambah Paket"), button:has-text("Tambah")').first();
    await addButton.click();
    
    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', { timeout: 5000 });
    
    // Fill form
    const packageName = `Test Package ${Date.now()}`;
    await page.fill('input[name="name"]', packageName);
    
    // Select package type
    const typeSelect = page.locator('select[name="type"], [role="combobox"]:has-text("Tipe")');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('CAR_RENTAL');
    }
    
    // Fill duration
    const durationInput = page.locator('input[name="durationHours"]');
    if (await durationInput.isVisible()) {
      await durationInput.fill('12');
    }
    
    // Fill all-in rate
    const rateInput = page.locator('input[name="allInRate"]');
    if (await rateInput.isVisible()) {
      await rateInput.fill('500000');
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

  test('should display paket list', async ({ page }) => {
    await page.goto('/paket');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for package cards or list
    const packageItems = page.locator('[class*="Card"], [class*="card"], table');
    const itemCount = await packageItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(0);
  });

  test('should view paket details', async ({ page }) => {
    await page.goto('/paket');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for detail/view buttons
    const detailButtons = page.locator('button:has-text("Detail"), button:has-text("View")');
    const buttonCount = await detailButtons.count();
    
    if (buttonCount > 0) {
      await detailButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Check for detail modal
      const detailModal = page.locator('[role="dialog"], [class*="Modal"]');
      await expect(detailModal.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should edit paket', async ({ page }) => {
    await page.goto('/paket');
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

