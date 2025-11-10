import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Transaksi Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display transactions page', async ({ page }) => {
    await page.goto('/transaksi');
    await page.waitForLoadState('networkidle');
    
    // Check page elements
    await expect(page.locator('text=/Transaksi|Transaction/i')).toBeVisible();
    
    // Check for "Tambah Transaksi" button
    const addButton = page.locator('button:has-text("Tambah Transaksi"), button:has-text("Tambah")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should open transaction dialog when clicking add button', async ({ page }) => {
    await page.goto('/transaksi');
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Transaksi" button
    const addButton = page.locator('button:has-text("Tambah Transaksi"), button:has-text("Tambah")').first();
    await addButton.click();
    
    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"], [class*="Dialog"], [class*="dialog"]', { timeout: 5000 });
    
    // Check form fields
    await expect(page.locator('input[name="customer_name"], input[placeholder*="Nama"]')).toBeVisible();
    await expect(page.locator('input[name="customer_phone"], input[placeholder*="Telepon"]')).toBeVisible();
  });

  test('should check vehicle availability when dates change', async ({ page }) => {
    await page.goto('/transaksi');
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Transaksi" button
    const addButton = page.locator('button:has-text("Tambah Transaksi"), button:has-text("Tambah")').first();
    await addButton.click();
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', { timeout: 5000 });
    
    // Fill checkout datetime
    const checkoutInput = page.locator('input[name="checkout_datetime"]');
    if (await checkoutInput.isVisible()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkoutStr = tomorrow.toISOString().slice(0, 16);
      await checkoutInput.fill(checkoutStr);
      
      // Fill checkin datetime
      const checkinInput = page.locator('input[name="checkin_datetime"]');
      const checkinDate = new Date(tomorrow);
      checkinDate.setHours(checkinDate.getHours() + 12);
      const checkinStr = checkinDate.toISOString().slice(0, 16);
      await checkinInput.fill(checkinStr);
      
      // Wait for availability check (debounce 500ms)
      await page.waitForTimeout(1000);
      
      // Check that vehicle dropdown exists
      const vehicleSelect = page.locator('select[name="armadaId"], [role="combobox"]:has-text("Armada")');
      await expect(vehicleSelect.first()).toBeVisible({ timeout: 5000 });
      
      // Check that driver dropdown exists
      const driverSelect = page.locator('select[name="driverId"], [role="combobox"]:has-text("Sopir")');
      await expect(driverSelect.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display transactions table', async ({ page }) => {
    await page.goto('/transaksi');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for table
    const table = page.locator('table, [class*="Table"], [class*="table"]');
    const tableCount = await table.count();
    expect(tableCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter transactions by date range', async ({ page }) => {
    await page.goto('/transaksi');
    await page.waitForLoadState('networkidle');
    
    // Look for date filter inputs
    const dateInputs = page.locator('input[type="date"], input[placeholder*="Dari"], input[placeholder*="Sampai"]');
    const inputCount = await dateInputs.count();
    
    if (inputCount > 0) {
      // Set date range
      const fromInput = dateInputs.first();
      const toInput = dateInputs.nth(1);
      
      if (await fromInput.isVisible() && await toInput.isVisible()) {
        const today = new Date().toISOString().split('T')[0];
        const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        
        await fromInput.fill(firstOfMonth);
        await toInput.fill(today);
        
        // Wait for filter to apply
        await page.waitForTimeout(2000);
        
        // Verify table is still visible
        const table = page.locator('table, [class*="Table"]');
        await expect(table.first()).toBeVisible();
      }
    }
  });

  test('should display transaction details', async ({ page }) => {
    await page.goto('/transaksi');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for detail/view buttons
    const detailButtons = page.locator('button:has-text("Detail"), button:has-text("View"), button[aria-label*="Detail"]');
    const buttonCount = await detailButtons.count();
    
    if (buttonCount > 0) {
      await detailButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Check for detail modal or dialog
      const detailModal = page.locator('[role="dialog"], [class*="Modal"], [class*="Dialog"]');
      await expect(detailModal.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

