import { test as base } from '@playwright/test';

/**
 * Helper untuk authentication
 */
export async function loginAsAdmin(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();
  
  await emailInput.fill(process.env.TEST_ADMIN_EMAIL || 'admin@example.com');
  await passwordInput.fill(process.env.TEST_ADMIN_PASSWORD || 'admin123');
  
  // Submit form
  await submitButton.click();
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  
  // Verify we're logged in
  await page.waitForSelector('text=Dashboard', { timeout: 5000 });
}

export async function loginAsManager(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();
  
  await emailInput.fill(process.env.TEST_MANAGER_EMAIL || 'manager@example.com');
  await passwordInput.fill(process.env.TEST_MANAGER_PASSWORD || 'manager123');
  await submitButton.click();
  
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForSelector('text=Dashboard', { timeout: 5000 });
}

export async function loginAsOperator(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();
  
  await emailInput.fill(process.env.TEST_OPERATOR_EMAIL || 'operator@example.com');
  await passwordInput.fill(process.env.TEST_OPERATOR_PASSWORD || 'operator123');
  await submitButton.click();
  
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForSelector('text=Dashboard', { timeout: 5000 });
}

/**
 * Get session cookie untuk authenticated requests
 */
export async function getAuthCookie(page) {
  const cookies = await page.context().cookies();
  return cookies.find(cookie => cookie.name === 'session');
}

/**
 * Save authenticated state
 */
export async function saveAuthState(page, filePath) {
  await page.context().storageState({ path: filePath });
}

/**
 * Load authenticated state
 */
export function loadAuthState(filePath) {
  return {
    storageState: filePath,
  };
}

