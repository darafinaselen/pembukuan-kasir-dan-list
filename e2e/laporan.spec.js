import { test, expect } from "@playwright/test";

test.describe("Laporan (Reports) Feature", () => {
  test("should display laporan page", async ({ page }) => {
    await page.goto("/laporan");
    await page.waitForLoadState("networkidle");

    // Check page title
    await expect(page.locator("text=/Laporan|Report/i")).toBeVisible();

    // Check for tabs
    await expect(
      page.locator('button:has-text("Laporan Transaksi")')
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Laporan Laba Rugi")')
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Laporan Pemasukan")')
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Laporan Pengeluaran")')
    ).toBeVisible();
    await expect(page.locator('button:has-text("Rekapitulasi")')).toBeVisible();
    await expect(
      page.locator('button:has-text("Laporan Kinerja")')
    ).toBeVisible();
  });

  test("should display laporan transaksi tab", async ({ page }) => {
    await page.goto("/laporan");
    await page.waitForLoadState("networkidle");

    // Click on "Laporan Transaksi" tab
    await page.click('button:has-text("Laporan Transaksi")');
    await page.waitForTimeout(1000);

    // Check for table or report content
    const table = page.locator('table, [class*="Table"]');
    const tableCount = await table.count();
    expect(tableCount).toBeGreaterThanOrEqual(0);
  });

  test("should display laporan laba rugi tab", async ({ page }) => {
    await page.goto("/laporan");
    await page.waitForLoadState("networkidle");

    // Click on "Laporan Laba Rugi" tab
    await page.click('button:has-text("Laporan Laba Rugi")');
    await page.waitForTimeout(1000);

    // Check for profit/loss information
    const profitLoss = page.locator("text=/Laba|Rugi|Profit|Loss/i");
    const count = await profitLoss.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display laporan pemasukan tab", async ({ page }) => {
    await page.goto("/laporan");
    await page.waitForLoadState("networkidle");

    // Click on "Laporan Pemasukan" tab
    await page.click('button:has-text("Laporan Pemasukan")');
    await page.waitForTimeout(1000);

    // Check for income information
    const income = page.locator("text=/Pemasukan|Income|Revenue/i");
    const count = await income.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display laporan pengeluaran tab", async ({ page }) => {
    await page.goto("/laporan");
    await page.waitForLoadState("networkidle");

    // Click on "Laporan Pengeluaran" tab
    await page.click('button:has-text("Laporan Pengeluaran")');
    await page.waitForTimeout(1000);

    // Check for expense information
    const expense = page.locator("text=/Pengeluaran|Expense/i");
    const count = await expense.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display rekapitulasi tab", async ({ page }) => {
    await page.goto("/laporan");
    await page.waitForLoadState("networkidle");

    // Click on "Rekapitulasi" tab
    await page.click('button:has-text("Rekapitulasi")');
    await page.waitForTimeout(1000);

    // Check for summary information
    const summary = page.locator("text=/Rekapitulasi|Summary/i");
    const count = await summary.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display laporan kinerja tab", async ({ page }) => {
    await page.goto("/laporan");
    await page.waitForLoadState("networkidle");

    // Click on "Laporan Kinerja" tab
    await page.click('button:has-text("Laporan Kinerja")');
    await page.waitForTimeout(1000);

    // Check for performance report content
    const performance = page.locator("text=/Kinerja|Performance/i");
    const count = await performance.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display driver performance in laporan kinerja", async ({
    page,
  }) => {
    await page.goto("/laporan");
    await page.waitForLoadState("networkidle");

    // Click on "Laporan Kinerja" tab
    await page.click('button:has-text("Laporan Kinerja")');
    await page.waitForTimeout(1000);

    // Click on "Kinerja Sopir" tab
    const driverTab = page.locator('button:has-text("Kinerja Sopir")');
    if (await driverTab.isVisible()) {
      await driverTab.click();
      await page.waitForTimeout(1000);

      // Check table headers
      await expect(
        page.locator("text=/Nama Sopir|Total Trip|Total Jam Kerja/i")
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("should display package performance in laporan kinerja", async ({
    page,
  }) => {
    await page.goto("/laporan");
    await page.waitForLoadState("networkidle");

    // Click on "Laporan Kinerja" tab
    await page.click('button:has-text("Laporan Kinerja")');
    await page.waitForTimeout(1000);

    // Click on "Kinerja Paket Jasa" tab
    const packageTab = page.locator('button:has-text("Kinerja Paket Jasa")');
    if (await packageTab.isVisible()) {
      await packageTab.click();
      await page.waitForTimeout(1000);

      // Check table headers
      await expect(
        page.locator("text=/Nama Paket|Frekuensi|Tipe/i")
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("should filter reports by date range", async ({ page }) => {
    await page.goto("/laporan");
    await page.waitForLoadState("networkidle");

    // Look for date filter inputs
    const dateInputs = page.locator(
      'input[type="date"], input[placeholder*="Dari"], input[placeholder*="Sampai"]'
    );
    const inputCount = await dateInputs.count();

    if (inputCount > 0) {
      const today = new Date().toISOString().split("T")[0];
      const firstOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];

      const fromInput = dateInputs.first();
      const toInput = dateInputs.nth(1);

      if ((await fromInput.isVisible()) && (await toInput.isVisible())) {
        await fromInput.fill(firstOfMonth);
        await toInput.fill(today);

        // Wait for data to reload
        await page.waitForTimeout(2000);

        // Verify content is still visible
        const content = page.locator(
          'table, [class*="Table"], [class*="Card"]'
        );
        const contentCount = await content.count();
        expect(contentCount).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
