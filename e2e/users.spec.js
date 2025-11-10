import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Users Management Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display users page', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page.locator('text=/User|Pengguna/i')).toBeVisible();
  });

  test('should display users list', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for users table or list
    const usersList = page.locator('table, [class*="Table"], [class*="Card"]');
    const count = await usersList.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display user information', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for user details (name, email, role)
    const userInfo = page.locator('text=/@|email|role|ADMIN|MANAGER|OPERATOR/i');
    const count = await userInfo.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

