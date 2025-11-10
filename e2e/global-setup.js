import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen to console messages
  page.on("console", (msg) => console.log("Browser console:", msg.text()));
  page.on("pageerror", (error) => console.log("Browser error:", error.message));

  // Create .auth directory if it doesn't exist
  const authDir = path.join(__dirname, ".auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  try {
    // Login as admin and save auth state
    await page.goto(
      process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000"
    );
    await page.waitForLoadState("networkidle");

    console.log("📸 Login page loaded, taking screenshot...");
    await page.screenshot({ path: path.join(authDir, "before-login.png") });

    const emailInput = page
      .locator('input[name="email"], input[type="email"]')
      .first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await emailInput.fill(
      process.env.TEST_ADMIN_EMAIL || "admin@pembukuan.com"
    );
    await passwordInput.fill(process.env.TEST_ADMIN_PASSWORD || "Admin123!");

    console.log("🔐 Filled credentials, clicking submit...");
    await submitButton.click();

    // Wait for navigation or error
    console.log("⏳ Waiting for navigation to dashboard...");
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    console.log("📸 Dashboard loaded, taking screenshot...");
    await page.screenshot({ path: path.join(authDir, "after-login.png") });

    // Save authenticated state
    await page
      .context()
      .storageState({ path: path.join(authDir, "admin.json") });
    console.log("✅ Admin auth state saved");
  } catch (error) {
    console.error("❌ Failed to setup admin auth state:", error);
    try {
      console.log("📸 Taking error screenshot...");
      await page.screenshot({ path: path.join(authDir, "error.png") });
      console.log("Current URL:", page.url());
    } catch (screenshotError) {
      console.log("Could not take screenshot:", screenshotError.message);
    }
    await browser.close();
    throw error;
  }

  await browser.close();
}

export default globalSetup;
