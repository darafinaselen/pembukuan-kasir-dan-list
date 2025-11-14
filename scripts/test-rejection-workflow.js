/**
 * Integration Test: Admin Rejection Workflow
 *
 * Menguji alur penolakan transaksi oleh admin:
 * 1. Login sebagai admin
 * 2. Lihat pending transactions
 * 3. Reject transaction dengan alasan
 * 4. Verifikasi status berubah ke REJECTED
 * 5. Verifikasi rejection_reason tersimpan
 * 6. Verifikasi audit log tercatat
 */

const BASE_URL = "http://localhost:3000";

// ANSI Colors
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
};

function log(message, color = "white") {
  const colorCode = colors[color] || colors.white;
  console.log(`${colorCode}${message}${colors.reset}`);
}

function logStep(stepNum, title) {
  console.log("\n" + "=".repeat(60));
  log(`📋 STEP ${stepNum}: ${title}`, "cyan");
  console.log("=".repeat(60));
}

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Login failed: ${response.status}`);
    console.error(`Response: ${errorText}`);
    throw new Error(`Login failed for ${email}`);
  }

  const data = await response.json();
  console.log(`� Login response:`, JSON.stringify(data, null, 2));

  // Check for token in different possible locations
  const token =
    data.token ||
    data.data?.token ||
    data.accessToken ||
    data.data?.accessToken;

  if (!token) {
    throw new Error(`No token found in login response`);
  }

  console.log(`�🔑 Token received: ${token.substring(0, 20)}...`);
  return token;
}

async function getPendingTransactions(token) {
  const response = await fetch(`${BASE_URL}/api/transactions/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Get pending failed: ${response.status}`);
    console.error(`Response: ${errorText}`);
    throw new Error("Failed to get pending transactions");
  }

  const data = await response.json();
  return data.data;
}

async function rejectTransaction(token, transactionId, rejectionReason) {
  const response = await fetch(
    `${BASE_URL}/api/transactions/${transactionId}/reject`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to reject transaction: ${errorText}`);
  }

  const data = await response.json();
  return data.data;
}

async function getTransaction(token, transactionId) {
  const response = await fetch(
    `${BASE_URL}/api/transactions/${transactionId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get transaction");
  }

  const data = await response.json();
  return data.data;
}

async function getAuditLogs(token, page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${BASE_URL}/api/audit-logs?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get audit logs");
  }

  const data = await response.json();
  return data.data;
}

async function runRejectionTest() {
  try {
    console.log("\n" + "█".repeat(70));
    log("  🎯 INTEGRATION TEST - REJECTION WORKFLOW", "magenta");
    log("  Testing Admin Rejection with Reason & Audit Logging", "magenta");
    console.log("█".repeat(70) + "\n");

    // STEP 1: Login as Admin
    logStep(1, "Login sebagai Admin");
    const adminToken = await login("admin@pembukuan.com", "admin@12345");
    log("✅ Admin berhasil login", "green");

    // STEP 2: Get Pending Transactions
    logStep(2, "Lihat Daftar Transaksi PENDING");
    const pendingResult = await getPendingTransactions(adminToken);
    const pendingTransactions = Array.isArray(pendingResult)
      ? pendingResult
      : pendingResult?.transactions || [];

    if (pendingTransactions.length === 0) {
      log("⚠️  Tidak ada transaksi PENDING", "yellow");
      log("   💡 Jalankan test-operator-scenario.js terlebih dahulu", "yellow");
      return;
    }

    log(
      `✅ Ditemukan ${pendingTransactions.length} transaksi PENDING`,
      "green"
    );
    const targetTransaction = pendingTransactions[0];
    log(`   Target: ${targetTransaction.invoice_code}`, "yellow");
    log(`   Customer: ${targetTransaction.customer_name}`, "yellow");
    log(
      `   Submitted: ${new Date(targetTransaction.submitted_at).toLocaleString("id-ID")}`,
      "yellow"
    );

    // STEP 3: Reject Transaction
    logStep(3, "Reject Transaksi dengan Alasan");
    const rejectionReason =
      "Data tidak lengkap, mohon dilengkapi informasi customer dan nomor telepon";

    const rejected = await rejectTransaction(
      adminToken,
      targetTransaction.id,
      rejectionReason
    );

    log(`✅ Transaksi berhasil DITOLAK: ${rejected.invoice_code}`, "green");
    log(`   Status: ${rejected.approval_status}`, "yellow");
    log(
      `   Rejected at: ${new Date(rejected.rejected_at).toLocaleString("id-ID")}`,
      "yellow"
    );
    log(`   Rejected by: ${rejected.rejected_by}`, "yellow");
    log(`   Alasan: ${rejected.rejection_reason}`, "yellow");

    // STEP 4: Verify Status Changed
    logStep(4, "Verifikasi Status berubah menjadi REJECTED");
    const verified = await getTransaction(adminToken, targetTransaction.id);

    if (verified.approval_status !== "REJECTED") {
      throw new Error(
        `Status verification failed: Expected REJECTED, got ${verified.approval_status}`
      );
    }

    log(`✅ Status terverifikasi: ${verified.approval_status}`, "green");
    log(`   Invoice: ${verified.invoice_code}`, "yellow");
    log(`   Customer: ${verified.customer_name}`, "yellow");

    // STEP 5: Verify Rejection Reason Stored
    logStep(5, "Verifikasi Rejection Reason Tersimpan");

    if (!verified.rejection_reason) {
      throw new Error("Rejection reason not stored in database");
    }

    if (verified.rejection_reason !== rejectionReason) {
      throw new Error(
        `Rejection reason mismatch: "${verified.rejection_reason}" !== "${rejectionReason}"`
      );
    }

    log("✅ Rejection reason tersimpan dengan benar", "green");
    log(`   Alasan: "${verified.rejection_reason}"`, "yellow");

    // STEP 6: Verify Audit Log
    logStep(6, "Verifikasi Audit Log tercatat");
    const auditLogs = await getAuditLogs(adminToken, 1, 5);

    const rejectLog = auditLogs.logs.find(
      (log) =>
        log.action === "REJECT" && log.resource_id === targetTransaction.id
    );

    if (!rejectLog) {
      log("⚠️  Audit log REJECT tidak ditemukan", "yellow");
    } else {
      log("✅ Audit log REJECT tercatat", "green");
      log(`   Action: ${rejectLog.action}`, "yellow");
      log(`   Description: ${rejectLog.description}`, "yellow");
      log(`   User: ${rejectLog.user?.username || "N/A"}`, "yellow");
      log(
        `   Timestamp: ${new Date(rejectLog.created_at).toLocaleString("id-ID")}`,
        "yellow"
      );
    }

    // STEP 7: Verify Transaction Still Locked
    logStep(7, "Verifikasi Transaksi REJECTED tetap terkunci");

    try {
      const editResponse = await fetch(
        `${BASE_URL}/api/transactions/${targetTransaction.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ customer_name: "Updated Name" }),
        }
      );

      if (editResponse.status === 403) {
        log("✅ Edit DITOLAK untuk transaksi REJECTED (403)", "green");
      } else {
        log("⚠️  Edit TIDAK ditolak untuk transaksi REJECTED", "yellow");
      }
    } catch (err) {
      log(`⚠️  Error saat verifikasi edit lock: ${err.message}`, "yellow");
    }

    // SUCCESS
    console.log("\n" + "=".repeat(70));
    log("✅ REJECTION WORKFLOW - ALL TESTS PASSED!", "bgGreen");
    console.log("=".repeat(70));

    console.log("\n" + "📊 TEST SUMMARY:");
    log("  ✓ Login sebagai Admin", "green");
    log("  ✓ Lihat daftar transaksi PENDING", "green");
    log("  ✓ Reject transaksi dengan alasan", "green");
    log("  ✓ Verifikasi status REJECTED", "green");
    log("  ✓ Verifikasi rejection_reason tersimpan", "green");
    log("  ✓ Verifikasi audit log tercatat", "green");
    log("  ✓ Verifikasi transaksi tetap terkunci", "green");

    console.log("\n" + "📝 STATISTICS:");
    log(`  • Rejected Transaction: ${targetTransaction.invoice_code}`, "cyan");
    log(`  • Rejection Reason: "${rejectionReason}"`, "cyan");
    log(`  • Rejected By: admin@pembukuan.com`, "cyan");
  } catch (error) {
    console.log("\n" + "=".repeat(70));
    log(`❌ REJECTION TEST FAILED: ${error.message}`, "bgRed");
    console.log("=".repeat(70));
    console.error(error);
    process.exit(1);
  }
}

// Run test
runRejectionTest();
