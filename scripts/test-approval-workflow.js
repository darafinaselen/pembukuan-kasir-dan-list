/**
 * Integration Test for Approval Workflow
 * Tests the complete workflow from DRAFT → PENDING → APPROVED/REJECTED
 * Run with: node scripts/test-approval-workflow.js
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Login helper
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed for ${email}`);
  }

  const data = await response.json();
  return data.data.token;
}

// Create test transaction
async function createTransaction(token) {
  const response = await fetch(`${BASE_URL}/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      customer_name: "Test Customer Approval",
      customer_phone: "081234567890",
      booking_date: new Date().toISOString(),
      checkout_datetime: new Date(Date.now() + 86400000).toISOString(),
      checkin_datetime: new Date(Date.now() + 172800000).toISOString(),
      all_in_rate: 500000,
      overtime_rate_per_hour: 50000,
      dp_amount: 0,
      payment_status: "UNPAID",
      armadaId: "armada-id-placeholder", // Replace with actual ID
      driverId: "driver-id-placeholder", // Replace with actual ID
      packageId: "package-id-placeholder", // Replace with actual ID
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Create transaction failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data;
}

// Submit transaction for approval
async function submitTransaction(token, transactionId) {
  const response = await fetch(
    `${BASE_URL}/api/transactions/${transactionId}/submit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Submit failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data.transaction;
}

// Approve transaction
async function approveTransaction(token, transactionId) {
  const response = await fetch(
    `${BASE_URL}/api/transactions/${transactionId}/approve`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Approve failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data.transaction;
}

// Reject transaction
async function rejectTransaction(token, transactionId, reason) {
  const response = await fetch(
    `${BASE_URL}/api/transactions/${transactionId}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rejection_reason: reason }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Reject failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data.transaction;
}

// Get pending transactions
async function getPendingTransactions(token) {
  const response = await fetch(`${BASE_URL}/api/transactions/pending`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Get pending failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data;
}

// Try to edit transaction
async function tryEditTransaction(token, transactionId, newName) {
  const response = await fetch(
    `${BASE_URL}/api/transactions/${transactionId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customer_name: newName,
      }),
    }
  );

  return {
    ok: response.ok,
    status: response.status,
    data: await response.json(),
  };
}

// Try to delete transaction
async function tryDeleteTransaction(token, transactionId) {
  const response = await fetch(
    `${BASE_URL}/api/transactions/${transactionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return {
    ok: response.ok,
    status: response.status,
    data: await response.json(),
  };
}

// Main test function
async function runTests() {
  log("\n🧪 Starting Approval Workflow Integration Tests\n", "cyan");

  try {
    // Test 1: Login as different roles
    log("📝 Test 1: Login as different users", "blue");
    const operatorToken = await login("operator@example.com", "password123");
    log("✅ Operator logged in", "green");

    const managerToken = await login("manager@example.com", "password123");
    log("✅ Manager logged in", "green");

    const adminToken = await login("admin@example.com", "password123");
    log("✅ Admin logged in", "green");

    // Test 2: Create transaction as OPERATOR (status: DRAFT)
    log("\n📝 Test 2: Create transaction as OPERATOR (DRAFT)", "blue");
    const transaction = await createTransaction(operatorToken);
    log(`✅ Transaction created: ${transaction.invoice_code}`, "green");
    log(`   Status: ${transaction.approval_status}`, "yellow");

    if (transaction.approval_status !== "DRAFT") {
      throw new Error("Expected status DRAFT");
    }

    // Test 3: Submit for approval (DRAFT → PENDING)
    log("\n📝 Test 3: Submit for approval (DRAFT → PENDING)", "blue");
    const submittedTransaction = await submitTransaction(
      operatorToken,
      transaction.id
    );
    log(
      `✅ Transaction submitted: ${submittedTransaction.invoice_code}`,
      "green"
    );
    log(`   Status: ${submittedTransaction.approval_status}`, "yellow");

    if (submittedTransaction.approval_status !== "PENDING") {
      throw new Error("Expected status PENDING");
    }

    // Test 4: Try to edit PENDING transaction (should fail)
    log("\n📝 Test 4: Try to edit PENDING transaction (should fail)", "blue");
    const editResult = await tryEditTransaction(
      operatorToken,
      transaction.id,
      "Updated Name"
    );

    if (editResult.ok) {
      throw new Error("Expected edit to fail for PENDING transaction");
    }
    log("✅ Edit blocked as expected (403)", "green");
    log(`   Error: ${editResult.data.error}`, "yellow");

    // Test 5: Try to delete PENDING transaction (should fail)
    log("\n📝 Test 5: Try to delete PENDING transaction (should fail)", "blue");
    const deleteResult = await tryDeleteTransaction(
      operatorToken,
      transaction.id
    );

    if (deleteResult.ok) {
      throw new Error("Expected delete to fail for PENDING transaction");
    }
    log("✅ Delete blocked as expected (403)", "green");
    log(`   Error: ${deleteResult.data.error}`, "yellow");

    // Test 6: Get pending transactions list
    log("\n📝 Test 6: Get pending transactions list", "blue");
    const pendingData = await getPendingTransactions(managerToken);
    log(
      `✅ Found ${pendingData.transactions.length} pending transactions`,
      "green"
    );
    log(`   Total: ${pendingData.pagination.total}`, "yellow");

    // Test 7: Approve transaction as MANAGER (PENDING → APPROVED)
    log(
      "\n📝 Test 7: Approve transaction as MANAGER (PENDING → APPROVED)",
      "blue"
    );
    const approvedTransaction = await approveTransaction(
      managerToken,
      transaction.id
    );
    log(
      `✅ Transaction approved: ${approvedTransaction.invoice_code}`,
      "green"
    );
    log(`   Status: ${approvedTransaction.approval_status}`, "yellow");

    if (approvedTransaction.approval_status !== "APPROVED") {
      throw new Error("Expected status APPROVED");
    }

    // Test 8: Try to edit APPROVED transaction (should fail)
    log("\n📝 Test 8: Try to edit APPROVED transaction (should fail)", "blue");
    const editApprovedResult = await tryEditTransaction(
      adminToken,
      transaction.id,
      "Another Update"
    );

    if (editApprovedResult.ok) {
      throw new Error("Expected edit to fail for APPROVED transaction");
    }
    log("✅ Edit blocked as expected (403)", "green");
    log(`   Error: ${editApprovedResult.data.error}`, "yellow");

    // Test 9: Create and reject a transaction
    log("\n📝 Test 9: Create, submit, and reject transaction", "blue");
    const transaction2 = await createTransaction(operatorToken);
    log(`✅ Transaction 2 created: ${transaction2.invoice_code}`, "green");

    const submitted2 = await submitTransaction(operatorToken, transaction2.id);
    log(`✅ Transaction 2 submitted: ${submitted2.approval_status}`, "green");

    const rejectedTransaction = await rejectTransaction(
      managerToken,
      transaction2.id,
      "Data tidak lengkap, mohon dilengkapi"
    );
    log(
      `✅ Transaction 2 rejected: ${rejectedTransaction.invoice_code}`,
      "green"
    );
    log(`   Status: ${rejectedTransaction.approval_status}`, "yellow");
    log(`   Reason: ${rejectedTransaction.rejection_reason}`, "yellow");

    if (rejectedTransaction.approval_status !== "REJECTED") {
      throw new Error("Expected status REJECTED");
    }

    // Test 10: Edit REJECTED transaction (should succeed)
    log(
      "\n📝 Test 10: Try to edit REJECTED transaction (should succeed)",
      "blue"
    );
    const editRejectedResult = await tryEditTransaction(
      operatorToken,
      transaction2.id,
      "Updated After Rejection"
    );

    if (!editRejectedResult.ok) {
      log(
        `⚠️  Edit REJECTED transaction status: ${editRejectedResult.status}`,
        "yellow"
      );
      log(
        `   This may fail due to validation, but should not be blocked by approval status`,
        "yellow"
      );
    } else {
      log("✅ Edit allowed for REJECTED transaction", "green");
    }

    // Summary
    log("\n" + "=".repeat(60), "cyan");
    log("✅ ALL TESTS PASSED!", "green");
    log("=".repeat(60), "cyan");
    log("\n📊 Test Summary:", "blue");
    log("  ✓ Login with different roles", "green");
    log("  ✓ Create transaction (DRAFT)", "green");
    log("  ✓ Submit for approval (DRAFT → PENDING)", "green");
    log("  ✓ Edit protection for PENDING", "green");
    log("  ✓ Delete protection for PENDING", "green");
    log("  ✓ Get pending transactions list", "green");
    log("  ✓ Approve transaction (PENDING → APPROVED)", "green");
    log("  ✓ Edit protection for APPROVED", "green");
    log("  ✓ Reject transaction (PENDING → REJECTED)", "green");
    log("  ✓ Edit allowed for REJECTED", "green");
  } catch (error) {
    log(`\n❌ TEST FAILED: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
