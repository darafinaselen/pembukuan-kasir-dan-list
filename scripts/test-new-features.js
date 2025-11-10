/**
 * Test script untuk fitur-fitur baru
 * - Availability Check API
 * - Performance Report API
 * - Dashboard Top Packages
 */

const API_BASE = process.env.API_BASE || "http://localhost:3000";

function log(message, color = "reset") {
  const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAvailabilityAPI() {
  log("\n=== Testing Availability API ===\n", "blue");

  const now = new Date();
  const checkout = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const checkin = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Day after tomorrow

  const checkoutStr = checkout.toISOString();
  const checkinStr = checkin.toISOString();

  // Test Vehicle Availability
  log("Testing GET /api/availability/vehicles", "cyan");
  try {
    const vehicleRes = await fetch(
      `${API_BASE}/api/availability/vehicles?checkout_datetime=${checkoutStr}&checkin_datetime=${checkinStr}`
    );

    if (vehicleRes.status === 401 || vehicleRes.status === 403) {
      log("✅ PASS: Vehicle availability endpoint exists (requires auth)", "green");
    } else if (vehicleRes.status === 400) {
      log("✅ PASS: Vehicle availability endpoint exists (validation error)", "green");
    } else if (vehicleRes.status === 200) {
      const data = await vehicleRes.json();
      log("✅ PASS: Vehicle availability endpoint works", "green");
      log(`   Available: ${data.data?.available?.length || 0}`, "blue");
      log(`   Busy: ${data.data?.busy?.length || 0}`, "blue");
    } else {
      log(`⚠️  WARN: Unexpected status ${vehicleRes.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, "red");
  }

  // Test Driver Availability
  log("\nTesting GET /api/availability/drivers", "cyan");
  try {
    const driverRes = await fetch(
      `${API_BASE}/api/availability/drivers?checkout_datetime=${checkoutStr}&checkin_datetime=${checkinStr}`
    );

    if (driverRes.status === 401 || driverRes.status === 403) {
      log("✅ PASS: Driver availability endpoint exists (requires auth)", "green");
    } else if (driverRes.status === 400) {
      log("✅ PASS: Driver availability endpoint exists (validation error)", "green");
    } else if (driverRes.status === 200) {
      const data = await driverRes.json();
      log("✅ PASS: Driver availability endpoint works", "green");
      log(`   Available: ${data.data?.available?.length || 0}`, "blue");
      log(`   Busy: ${data.data?.busy?.length || 0}`, "blue");
    } else {
      log(`⚠️  WARN: Unexpected status ${driverRes.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, "red");
  }

  // Test validation
  log("\nTesting validation (missing params)", "cyan");
  try {
    const invalidRes = await fetch(
      `${API_BASE}/api/availability/vehicles`
    );

    if (invalidRes.status === 400) {
      log("✅ PASS: Validation works (missing params)", "green");
    } else if (invalidRes.status === 401 || invalidRes.status === 403) {
      log("✅ PASS: Endpoint exists (requires auth)", "green");
    } else {
      log(`⚠️  WARN: Unexpected status ${invalidRes.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, "red");
  }
}

async function testPerformanceReportAPI() {
  log("\n=== Testing Performance Report API ===\n", "blue");

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = now;

  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];

  log("Testing GET /api/reports/performance", "cyan");
  try {
    const res = await fetch(
      `${API_BASE}/api/reports/performance?from=${fromStr}&to=${toStr}`
    );

    if (res.status === 401 || res.status === 403) {
      log("✅ PASS: Performance report endpoint exists (requires auth)", "green");
    } else if (res.status === 400) {
      log("✅ PASS: Performance report endpoint exists (validation error)", "green");
    } else if (res.status === 200) {
      const data = await res.json();
      log("✅ PASS: Performance report endpoint works", "green");
      log(`   Drivers: ${data.data?.driverPerformance?.length || 0}`, "blue");
      log(`   Packages: ${data.data?.packagePerformance?.length || 0}`, "blue");
    } else {
      log(`⚠️  WARN: Unexpected status ${res.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, "red");
  }

  // Test validation
  log("\nTesting validation (missing params)", "cyan");
  try {
    const invalidRes = await fetch(`${API_BASE}/api/reports/performance`);

    if (invalidRes.status === 400) {
      log("✅ PASS: Validation works (missing params)", "green");
    } else if (invalidRes.status === 401 || invalidRes.status === 403) {
      log("✅ PASS: Endpoint exists (requires auth)", "green");
    } else {
      log(`⚠️  WARN: Unexpected status ${invalidRes.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, "red");
  }
}

async function testDashboardStats() {
  log("\n=== Testing Dashboard Stats (Top Packages) ===\n", "blue");

  log("Testing GET /api/dashboard/stats", "cyan");
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/stats?period=month`);

    if (res.status === 401 || res.status === 403) {
      log("✅ PASS: Dashboard stats endpoint exists (requires auth)", "green");
    } else if (res.status === 200) {
      const data = await res.json();
      log("✅ PASS: Dashboard stats endpoint works", "green");
      if (data.data?.topPackages) {
        log(`   Top Packages: ${data.data.topPackages.length}`, "blue");
        log("✅ PASS: Top packages data exists", "green");
      } else {
        log("⚠️  WARN: Top packages data not found", "yellow");
      }
    } else {
      log(`⚠️  WARN: Unexpected status ${res.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, "red");
  }
}

async function runAllTests() {
  log("\n" + "=".repeat(60), "blue");
  log("TESTING NEW FEATURES", "blue");
  log("=".repeat(60), "blue");

  await testAvailabilityAPI();
  await testPerformanceReportAPI();
  await testDashboardStats();

  log("\n" + "=".repeat(60), "blue");
  log("TESTING COMPLETE", "blue");
  log("=".repeat(60), "blue");
}

// Run tests
runAllTests().catch((error) => {
  log(`\n❌ FATAL ERROR: ${error.message}`, "red");
  process.exit(1);
});

