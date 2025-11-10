import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Pengeluaran (Expenses) Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display pengeluaran page', async ({ page }) => {
    await page.goto('/pengeluaran');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page.locator('text=/Pengeluaran|Expense/i')).toBeVisible();
    
    // Check for "Tambah Pengeluaran" button
    const addButton = page.locator('button:has-text("Tambah Pengeluaran"), button:has-text("Tambah")');
    await expect(addButton.first()).toBeVisible();
  });

  test('should open add pengeluaran dialog', async ({ page }) => {
    await page.goto('/pengeluaran');
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Pengeluaran" button
    const addButton = page.locator('button:has-text("Tambah Pengeluaran"), button:has-text("Tambah")').first();
    await addButton.click();
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', { timeout: 5000 });
    
    // Check form fields
    await expect(page.locator('input[name="date"], input[type="date"]')).toBeVisible();
    await expect(page.locator('select[name="category"], [role="combobox"]:has-text("Kategori")')).toBeVisible();
    await expect(page.locator('input[name="amount"], input[placeholder*="Jumlah"]')).toBeVisible();
  });

  test('should create new pengeluaran', async ({ page }) => {
    await page.goto('/pengeluaran');
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Pengeluaran" button
    const addButton = page.locator('button:has-text("Tambah Pengeluaran"), button:has-text("Tambah")').first();
    await addButton.click();
    
    await page.waitForSelector('[role="dialog"], [class*="Dialog"]', { timeout: 5000 });
    
    // Fill form
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date"]', today);
    
    // Select category
    const categorySelect = page.locator('select[name="category"], [role="combobox"]:has-text("Kategori")');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('LISTRIK');
    }
    
    // Fill amount
    await page.fill('input[name="amount"]', '100000');
    await page.fill('input[name="description"], textarea[name="description"]', 'Test Expense');
    
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

  test('should filter pengeluaran by date range', async ({ page }) => {
    await page.goto('/pengeluaran');
    await page.waitForLoadState('networkidle');
    
    // Look for date filter inputs
    const dateInputs = page.locator('input[type="date"], input[placeholder*="Dari"], input[placeholder*="Sampai"]');
    const inputCount = await dateInputs.count();
    
    if (inputCount > 0) {
      const today = new Date().toISOString().split('T')[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      
      const fromInput = dateInputs.first();
      const toInput = dateInputs.nth(1);
      
      if (await fromInput.isVisible() && await toInput.isVisible()) {
        await fromInput.fill(firstOfMonth);
        await toInput.fill(today);
        
        await page.waitForTimeout(2000);
        
        // Verify table is still visible
        const table = page.locator('table, [class*="Table"]');
        await expect(table.first()).toBeVisible();
      }
    }
  });

  test('should filter pengeluaran by category', async ({ page }) => {
    await page.goto('/pengeluaran');
    await page.waitForLoadState('networkidle');
    
    // Look for category filter
    const categoryFilter = page.locator('select[name="category"], button:has-text("Kategori")');
    const filterCount = await categoryFilter.count();
    
    if (filterCount > 0) {
      await categoryFilter.first().click();
      await page.waitForTimeout(500);
      
      // Select category
      await page.click('text=LISTRIK');
      await page.waitForTimeout(1000);
      
      // Verify table is still visible
      const table = page.locator('table, [class*="Table"]');
      await expect(table.first()).toBeVisible();
    }
  });
});

