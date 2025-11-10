import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Create .auth directory if it doesn't exist
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  try {
    // Login as admin and save auth state
    await page.goto(process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    await emailInput.fill(process.env.TEST_ADMIN_EMAIL || 'admin@example.com');
    await passwordInput.fill(process.env.TEST_ADMIN_PASSWORD || 'admin123');
    await submitButton.click();
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Save authenticated state
    await page.context().storageState({ path: path.join(authDir, 'admin.json') });
    console.log('✅ Admin auth state saved');
  } catch (error) {
    console.error('❌ Failed to setup admin auth state:', error);
    throw error;
  }
  
  await browser.close();
}

export default globalSetup;

