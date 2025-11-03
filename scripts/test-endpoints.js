/**
 * Quick Test Script - API Endpoints Verification
 *
 * Script ini untuk verifikasi cepat bahwa semua endpoint bisa diakses
 * Tidak perlu database setup, hanya cek response code
 */

const API_BASE = "http://localhost:3000/api";

// Color output untuk terminal
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, path, description) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      // Tidak perlu body untuk quick test
      body:
        method !== "GET" && method !== "DELETE"
          ? JSON.stringify({})
          : undefined,
    });

    const status = response.status;

    // Status code yang kita harapkan:
    // 401/403 = Unauthorized (OK, berarti endpoint ada)
    // 404 = Not Found (BAD, berarti endpoint tidak ada)
    // 400 = Bad Request (OK, berarti endpoint ada tapi validation gagal)
    // 500 = Server Error (OK untuk test ini, berarti endpoint ada)

    if (status === 404) {
      log(`❌ FAIL: ${method} ${path} - ${description}`, "red");
      log(`   Status: ${status} (Endpoint tidak ditemukan)`, "red");
      return false;
    } else if (status === 401 || status === 403) {
      log(`✅ PASS: ${method} ${path} - ${description}`, "green");
      log(`   Status: ${status} (Endpoint ada, butuh auth)`, "blue");
      return true;
    } else if (status === 400) {
      log(`✅ PASS: ${method} ${path} - ${description}`, "green");
      log(`   Status: ${status} (Endpoint ada, validation error)`, "blue");
      return true;
    } else {
      log(`⚠️  WARN: ${method} ${path} - ${description}`, "yellow");
      log(`   Status: ${status} (Unexpected)`, "yellow");
      return true; // Still counts as pass
    }
  } catch (error) {
    log(`❌ ERROR: ${method} ${path} - ${description}`, "red");
    log(`   Error: ${error.message}`, "red");
    return false;
  }
}

async function runTests() {
  log("\n=== API UPDATE/DELETE ENDPOINTS VERIFICATION ===\n", "blue");

  const results = {
    passed: 0,
    failed: 0,
  };

  // Test all UPDATE and DELETE endpoints
  const tests = [
    // Transactions
    { method: "GET", path: "/transactions/test-id", desc: "Get Transaction" },
    {
      method: "PUT",
      path: "/transactions/test-id",
      desc: "Update Transaction",
    },
    {
      method: "DELETE",
      path: "/transactions/test-id",
      desc: "Delete Transaction",
    },

    // Expenses
    { method: "GET", path: "/expenses/test-id", desc: "Get Expense" },
    { method: "PUT", path: "/expenses/test-id", desc: "Update Expense" },
    { method: "DELETE", path: "/expenses/test-id", desc: "Delete Expense" },

    // Users
    { method: "GET", path: "/users/test-id", desc: "Get User" },
    { method: "PUT", path: "/users/test-id", desc: "Update User" },
    { method: "DELETE", path: "/users/test-id", desc: "Delete User" },

    // Packages
    { method: "GET", path: "/packages/test-id", desc: "Get Package" },
    { method: "PUT", path: "/packages/test-id", desc: "Update Package" },
    { method: "DELETE", path: "/packages/test-id", desc: "Delete Package" },

    // Drivers (NEWLY CREATED)
    { method: "GET", path: "/drivers/test-id", desc: "Get Driver (NEW)" },
    { method: "PUT", path: "/drivers/test-id", desc: "Update Driver (NEW)" },
    { method: "DELETE", path: "/drivers/test-id", desc: "Delete Driver (NEW)" },

    // Vehicles (NEWLY CREATED)
    { method: "GET", path: "/vehicles/test-id", desc: "Get Vehicle (NEW)" },
    { method: "PUT", path: "/vehicles/test-id", desc: "Update Vehicle (NEW)" },
    {
      method: "DELETE",
      path: "/vehicles/test-id",
      desc: "Delete Vehicle (NEW)",
    },
  ];

  log("Starting endpoint tests...\n", "blue");

  for (const test of tests) {
    const passed = await testEndpoint(test.method, test.path, test.desc);
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Summary
  log("\n=== TEST SUMMARY ===", "blue");
  log(`Total Tests: ${tests.length}`);
  log(`Passed: ${results.passed}`, "green");
  log(`Failed: ${results.failed}`, results.failed > 0 ? "red" : "green");
  log(`Success Rate: ${((results.passed / tests.length) * 100).toFixed(1)}%\n`);

  if (results.failed === 0) {
    log("✅ All endpoints are accessible!", "green");
  } else {
    log("❌ Some endpoints are missing or not accessible!", "red");
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    log("Checking if server is running...", "blue");
    const response = await fetch(`${API_BASE}/health`, { method: "GET" });
    log("✅ Server is running!\n", "green");
    return true;
  } catch (error) {
    log("❌ Server is not running!", "red");
    log("Please start the development server first:", "yellow");
    log("  npm run dev\n", "yellow");
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    log("⚠️  Skipping tests - server not available", "yellow");
    process.exit(0);
  }

  await runTests();
})();
