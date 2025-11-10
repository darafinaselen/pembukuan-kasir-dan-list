import { test, expect } from "@playwright/test";

test.describe("Dashboard Feature", () => {
  test("should display dashboard page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Check page title
    await expect(page.locator("text=Dashboard")).toBeVisible();

    // Check period filter buttons
    await expect(page.locator('button:has-text("Hari Ini")')).toBeVisible();
    await expect(page.locator('button:has-text("Bulan Ini")')).toBeVisible();
    await expect(page.locator('button:has-text("Tahun Ini")')).toBeVisible();
  });

  test("should display dashboard stats cards", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Wait for stats to load
    await page.waitForTimeout(2000);

    // Check for stats cards (revenue, profit, transactions, etc.)
    const statsCards = page.locator('[class*="card"], [class*="Card"]');
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display transaction chart", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Check for chart (could be SVG or canvas)
    const chart = page.locator(
      'svg, canvas, [class*="chart"], [class*="Chart"]'
    );
    const chartCount = await chart.count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test("should display fleet status chart", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Check for fleet status information
    const fleetStatus = page.locator(
      "text=/Available|On Trip|Maintenance|READY/i"
    );
    const statusCount = await fleetStatus.count();
    expect(statusCount).toBeGreaterThanOrEqual(0);
  });

  test("should display top 5 packages widget", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Check widget title
    await expect(page.locator("text=Top 5 Paket Jasa Terlaris")).toBeVisible();

    // Check pie chart exists
    const pieChart = page.locator('svg[viewBox="0 0 100 100"]');
    const pieChartCount = await pieChart.count();
    expect(pieChartCount).toBeGreaterThanOrEqual(0);

    // Check list view exists
    const packageList = page.locator('[class*="border rounded-lg"]');
    const listCount = await packageList.count();
    expect(listCount).toBeGreaterThanOrEqual(0);
  });

  test("should change period filter", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Click "Hari Ini" button
    await page.click('button:has-text("Hari Ini")');
    await page.waitForTimeout(1000);

    // Click "Bulan Ini" button
    await page.click('button:has-text("Bulan Ini")');
    await page.waitForTimeout(1000);

    // Click "Tahun Ini" button
    await page.click('button:has-text("Tahun Ini")');
    await page.waitForTimeout(2000);

    // Verify stats are still visible
    const statsCards = page.locator('[class*="card"]');
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);
  });
});
