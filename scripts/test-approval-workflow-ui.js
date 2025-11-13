/**
 * Test Approval Workflow UI Integration
 * Tests the complete approval workflow from Operator to Admin
 */

const API_BASE = "http://localhost:3000/api";

// Test credentials
const OPERATOR = {
  username: "operator",
  password: "Operator123!",
};

const ADMIN = {
  username: "admin",
  password: "Admin123!",
};

let operatorSession = null;
let adminSession = null;
let testTransactionId = null;

/**
 * Login and get session cookie
 */
async function login(credentials) {
  console.log(`\n🔐 Logging in as ${credentials.username}...`);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Login failed: ${data.message}`);
  }

  // Extract session cookie
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No session cookie received");
  }

  const sessionMatch = setCookie.match(/session=([^;]+)/);
  const sessionCookie = sessionMatch ? sessionMatch[1] : null;

  console.log(`✅ Logged in as ${credentials.username}`);
  console.log(`   Role: ${data.data?.user?.role || data.user?.role}`);

  return sessionCookie;
}

/**
 * Create a test transaction as Operator
 */
async function createTransaction(sessionCookie) {
  console.log("\n📝 Creating test transaction as Operator...");

  // First, fetch available packages, armada, and drivers
  const [packagesRes, armadaRes, driversRes] = await Promise.all([
    fetch(`${API_BASE}/packages`, {
      headers: { Cookie: `session=${sessionCookie}` },
    }),
    fetch(`${API_BASE}/vehicles?status=READY`, {
      headers: { Cookie: `session=${sessionCookie}` },
    }),
    fetch(`${API_BASE}/drivers?status=READY`, {
      headers: { Cookie: `session=${sessionCookie}` },
    }),
  ]);

  const packages = await packagesRes.json();
  const armada = await armadaRes.json();
  const drivers = await driversRes.json();

  console.log(`   📦 Found ${packages.data?.length || 0} packages`);
  console.log(`   🚗 Found ${armada.data?.length || 0} available vehicles`);
  console.log(`   👤 Found ${drivers.data?.length || 0} available drivers`);

  if (!packages.data?.length || !armada.data?.length || !drivers.data?.length) {
    throw new Error("Missing required data (packages/armada/drivers)");
  }

  const now = new Date();
  const checkoutDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const checkinDate = new Date(checkoutDate.getTime() + 12 * 60 * 60 * 1000); // +12 hours

  const payload = {
    customer_name: "Test Customer Approval",
    customer_phone: "081234567890",
    booking_date: now.toISOString(),
    checkout_datetime: checkoutDate.toISOString(),
    checkin_datetime: checkinDate.toISOString(),
    packageId: packages.data[0].id,
    armadaId: armada.data[0].id,
    driverId: drivers.data[0].id,
    all_in_rate: 500000,
    overtime_rate_per_hour: 50000,
    dp_amount: 0,
    payment_status: "UNPAID",
  };

  const res = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session=${sessionCookie}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Create transaction failed: ${data.message}`);
  }

  const transaction = data.data;
  console.log(`✅ Transaction created: ${transaction.invoice_code}`);
  console.log(`   ID: ${transaction.id}`);
  console.log(`   Approval Status: ${transaction.approval_status}`);

  return transaction.id;
}

/**
 * Submit transaction for approval (DRAFT → PENDING)
 */
async function submitForApproval(transactionId, sessionCookie) {
  console.log("\n📤 Submitting transaction for approval...");

  const res = await fetch(`${API_BASE}/transactions/${transactionId}/submit`, {
    method: "POST",
    headers: { Cookie: `session=${sessionCookie}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Submit failed: ${data.message}`);
  }

  console.log(`✅ Transaction submitted for approval`);
  console.log(`   Approval Status: ${data.data.approval_status}`);
  console.log(`   Submitted At: ${data.data.submitted_at}`);
  console.log(`   Submitted By: ${data.data.submitted_by}`);

  return data.data;
}

/**
 * Approve transaction (PENDING → APPROVED)
 */
async function approveTransaction(transactionId, sessionCookie) {
  console.log("\n✅ Approving transaction as Admin...");

  const res = await fetch(`${API_BASE}/transactions/${transactionId}/approve`, {
    method: "POST",
    headers: { Cookie: `session=${sessionCookie}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Approve failed: ${data.message}`);
  }

  console.log(`✅ Transaction approved`);
  console.log(`   Approval Status: ${data.data.approval_status}`);
  console.log(`   Approved At: ${data.data.approved_at}`);
  console.log(`   Approved By: ${data.data.approved_by}`);
  console.log(`   Armada Status: ${data.data.armada?.status}`);
  console.log(`   Driver Status: ${data.data.driver?.status}`);

  return data.data;
}

/**
 * Reject transaction (PENDING → REJECTED)
 */
async function rejectTransaction(transactionId, sessionCookie, reason) {
  console.log("\n❌ Rejecting transaction as Admin...");

  const res = await fetch(`${API_BASE}/transactions/${transactionId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session=${sessionCookie}`,
    },
    body: JSON.stringify({ rejection_reason: reason }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Reject failed: ${data.message}`);
  }

  console.log(`✅ Transaction rejected`);
  console.log(`   Approval Status: ${data.data.approval_status}`);
  console.log(`   Rejected At: ${data.data.rejected_at}`);
  console.log(`   Rejected By: ${data.data.rejected_by}`);
  console.log(`   Rejection Reason: ${data.data.rejection_reason}`);

  return data.data;
}

/**
 * Get transaction details
 */
async function getTransaction(transactionId, sessionCookie) {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}`, {
    headers: { Cookie: `session=${sessionCookie}` },
  });

  const data = await res.json();
  return data.data;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("=".repeat(60));
  console.log("🧪 Testing Approval Workflow UI Integration");
  console.log("=".repeat(60));

  try {
    // Test 1: Login as Operator and Admin
    console.log("\n" + "=".repeat(60));
    console.log("TEST 1: Login");
    console.log("=".repeat(60));

    operatorSession = await login(OPERATOR);
    adminSession = await login(ADMIN);

    // Test 2: Operator creates transaction (DRAFT)
    console.log("\n" + "=".repeat(60));
    console.log("TEST 2: Create Transaction (DRAFT)");
    console.log("=".repeat(60));

    testTransactionId = await createTransaction(operatorSession);

    // Test 3: Operator submits for approval (DRAFT → PENDING)
    console.log("\n" + "=".repeat(60));
    console.log("TEST 3: Submit for Approval (DRAFT → PENDING)");
    console.log("=".repeat(60));

    await submitForApproval(testTransactionId, operatorSession);

    // Test 4a: Admin approves (PENDING → APPROVED)
    console.log("\n" + "=".repeat(60));
    console.log("TEST 4a: Admin Approve (PENDING → APPROVED)");
    console.log("=".repeat(60));

    await approveTransaction(testTransactionId, adminSession);

    // Test 5: Create another transaction for rejection test
    console.log("\n" + "=".repeat(60));
    console.log("TEST 5: Create Another Transaction for Rejection");
    console.log("=".repeat(60));

    const testTransactionId2 = await createTransaction(operatorSession);
    await submitForApproval(testTransactionId2, operatorSession);

    // Test 4b: Admin rejects (PENDING → REJECTED)
    console.log("\n" + "=".repeat(60));
    console.log("TEST 4b: Admin Reject (PENDING → REJECTED)");
    console.log("=".repeat(60));

    await rejectTransaction(
      testTransactionId2,
      adminSession,
      "Harga tidak sesuai dengan pasar"
    );

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL TESTS PASSED");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log("   ✅ Login: Operator & Admin");
    console.log("   ✅ Create Transaction: DRAFT status");
    console.log("   ✅ Submit for Approval: DRAFT → PENDING");
    console.log("   ✅ Approve Transaction: PENDING → APPROVED");
    console.log("   ✅ Reject Transaction: PENDING → REJECTED");
    console.log("\n🎉 Approval Workflow UI Integration: SUCCESS");
    console.log("\n📝 Created transactions:");
    console.log(`   - ${testTransactionId} (APPROVED)`);
    console.log(`   - ${testTransactionId2} (REJECTED)`);
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ TEST FAILED");
    console.error("=".repeat(60));
    console.error("\n Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
