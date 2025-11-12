/**
 * Integration Test - Admin Scenario
 * Tests complete admin workflow with approval system
 * Run with: node scripts/test-admin-scenario.js
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(`📋 STEP ${step}: ${message}`, "blue");
  log("=".repeat(60), "cyan");
}

// Helper functions
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

async function getPendingTransactions(token) {
  const response = await fetch(`${BASE_URL}/api/transactions/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get pending transactions");
  }

  const data = await response.json();
  return data.data;
}

async function approveTransaction(token, transactionId) {
  const response = await fetch(
    `${BASE_URL}/api/transactions/${transactionId}/approve`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Approve failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data.transaction;
}

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

async function getReportSummary(token, startDate, endDate) {
  const params = new URLSearchParams({
    from: startDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
    to: endDate.toISOString().split("T")[0],
  });

  const response = await fetch(
    `${BASE_URL}/api/reports/summary?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Report summary failed: ${response.status}`);
    console.error(`Response: ${errorText}`);
    throw new Error("Failed to get report summary");
  }

  const data = await response.json();
  return data.data;
}

async function getPerformanceReport(token, startDate, endDate) {
  const params = new URLSearchParams({
    from: startDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
    to: endDate.toISOString().split("T")[0],
  });

  const response = await fetch(
    `${BASE_URL}/api/reports/performance?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Performance report failed: ${response.status}`);
    console.error(`Response: ${errorText}`);
    throw new Error("Failed to get performance report");
  }

  const data = await response.json();
  return data.data;
}

async function getExpenses(token) {
  const response = await fetch(`${BASE_URL}/api/expenses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get expenses");
  }

  const data = await response.json();
  return data.data;
}

async function getAuditLogs(token, page = 1, limit = 10) {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  
  const response = await fetch(`${BASE_URL}/api/audit-logs?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get audit logs");
  }

  const data = await response.json();
  return data.data;
}

// Main test
async function runAdminScenario() {
  log("\n" + "█".repeat(70), "magenta");
  log("  🎯 INTEGRATION TEST - ADMIN SCENARIO", "magenta");
  log("  Testing Complete Admin Workflow with Approval & Reports", "cyan");
  log("█".repeat(70) + "\n", "magenta");

  try {
    // STEP 1: Login as Admin
    logStep(1, "Login sebagai Admin");
    const adminToken = await login("admin@pembukuan.com", "admin@12345");
    log("✅ Admin berhasil login", "green");

    // STEP 2: Get pending transactions
    logStep(2, "Lihat Daftar Transaksi yang Menunggu Persetujuan (PENDING)");
    const pendingData = await getPendingTransactions(adminToken);
    log(`✅ Ditemukan ${pendingData.transactions.length} transaksi PENDING`, "green");
    
    if (pendingData.transactions.length > 0) {
      pendingData.transactions.forEach((trans, idx) => {
        log(`   ${idx + 1}. ${trans.invoice_code} - ${trans.customer_name}`, "yellow");
        log(`      Status: ${trans.approval_status}`, "yellow");
        log(`      Diajukan: ${new Date(trans.submitted_at).toLocaleString("id-ID")}`, "yellow");
        log(`      Oleh: ${trans.submitted_by}`, "yellow");
      });
    } else {
      log("   ℹ️  Tidak ada transaksi pending saat ini", "yellow");
      log("   💡 Jalankan test-operator-scenario.js terlebih dahulu", "cyan");
    }

    // STEP 3: Approve first pending transaction (if exists)
    if (pendingData.transactions.length > 0) {
      logStep(3, "Approve Transaksi Pertama (PENDING → APPROVED)");
      const firstPending = pendingData.transactions[0];
      
      const approvedTrans = await approveTransaction(adminToken, firstPending.id);
      log(`✅ Transaksi berhasil DISETUJUI: ${approvedTrans.invoice_code}`, "green");
      log(`   Status: ${approvedTrans.approval_status}`, "yellow");
      log(`   Approved at: ${new Date(approvedTrans.approved_at).toLocaleString("id-ID")}`, "yellow");
      log(`   Approved by: ${approvedTrans.approved_by}`, "yellow");

      if (approvedTrans.approval_status !== "APPROVED") {
        throw new Error("Expected transaction status to be APPROVED");
      }

      // STEP 4: Verify approved transaction
      logStep(4, "Verifikasi Status Transaksi berubah menjadi APPROVED");
      const verifiedTrans = await getTransaction(adminToken, firstPending.id);
      log(`✅ Status terverifikasi: ${verifiedTrans.approval_status}`, "green");
      log(`   Invoice: ${verifiedTrans.invoice_code}`, "yellow");
      log(`   Customer: ${verifiedTrans.customer_name}`, "yellow");
    }

    // STEP 5: Reject second pending transaction (if exists)
    if (pendingData.transactions.length > 1) {
      logStep(5, "Reject Transaksi Kedua (PENDING → REJECTED)");
      const secondPending = pendingData.transactions[1];
      const rejectionReason = "Data tidak lengkap, mohon dilengkapi informasi customer";
      
      const rejectedTrans = await rejectTransaction(
        adminToken,
        secondPending.id,
        rejectionReason
      );
      log(`✅ Transaksi berhasil DITOLAK: ${rejectedTrans.invoice_code}`, "green");
      log(`   Status: ${rejectedTrans.approval_status}`, "yellow");
      log(`   Rejected at: ${new Date(rejectedTrans.rejected_at).toLocaleString("id-ID")}`, "yellow");
      log(`   Rejected by: ${rejectedTrans.rejected_by}`, "yellow");
      log(`   Alasan: ${rejectedTrans.rejection_reason}`, "yellow");

      if (rejectedTrans.approval_status !== "REJECTED") {
        throw new Error("Expected transaction status to be REJECTED");
      }

      // STEP 6: Verify rejected transaction
      logStep(6, "Verifikasi Status Transaksi berubah menjadi REJECTED");
      const verifiedRejected = await getTransaction(adminToken, secondPending.id);
      log(`✅ Status terverifikasi: ${verifiedRejected.approval_status}`, "green");
      log(`   Invoice: ${verifiedRejected.invoice_code}`, "yellow");
      log(`   Alasan penolakan: ${verifiedRejected.rejection_reason}`, "yellow");
    }

    // STEP 7: Check Income Report (W1)
    logStep(7, "Cek Laporan Pemasukan (W1)");
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const reportSummary = await getReportSummary(adminToken, startDate, endDate);
    log("✅ Laporan Pemasukan berhasil diambil", "green");
    log(`   Total Pemasukan: Rp ${(reportSummary.totalRevenue || 0).toLocaleString("id-ID")}`, "yellow");
    log(`   Total Transaksi: ${reportSummary.totalTransactions || 0}`, "yellow");
    log(`   Rata-rata per Transaksi: Rp ${(reportSummary.averageRevenue || 0).toLocaleString("id-ID")}`, "yellow");

    // STEP 8: Check Expense Report (W2)
    logStep(8, "Cek Laporan Pengeluaran (W2)");
    const expensesResult = await getExpenses(adminToken);
    const expenses = Array.isArray(expensesResult) ? expensesResult : (expensesResult?.expenses || []);
    log(`✅ Ditemukan ${expenses.length} pengeluaran`, "green");
    
    const totalExpenses = expenses.length > 0 
      ? expenses.reduce((sum, exp) => sum + exp.amount, 0)
      : 0;
    log(`   Total Pengeluaran: Rp ${totalExpenses.toLocaleString("id-ID")}`, "yellow");
    
    if (expenses.length > 0) {
      log(`   Pengeluaran terakhir:`, "yellow");
      expenses.slice(0, 3).forEach((exp, idx) => {
        log(`     ${idx + 1}. ${exp.description} - Rp ${exp.amount.toLocaleString("id-ID")}`, "yellow");
      });
    }

    // STEP 9: Check Performance Report (W3/W4)
    logStep(9, "Cek Laporan Kinerja (W3/W4)");
    const perfReport = await getPerformanceReport(adminToken, startDate, endDate);
    log("✅ Laporan Kinerja berhasil diambil", "green");
    
    if (perfReport.vehiclePerformance && perfReport.vehiclePerformance.length > 0) {
      log(`   Top 3 Armada:`, "yellow");
      perfReport.vehiclePerformance.slice(0, 3).forEach((vehicle, idx) => {
        log(`     ${idx + 1}. ${vehicle.licensePlate} - ${vehicle.tripCount} trips`, "yellow");
      });
    }
    
    if (perfReport.driverPerformance && perfReport.driverPerformance.length > 0) {
      log(`   Top 3 Driver:`, "yellow");
      perfReport.driverPerformance.slice(0, 3).forEach((driver, idx) => {
        log(`     ${idx + 1}. ${driver.name} - ${driver.tripCount} trips`, "yellow");
      });
    }

    // STEP 10: Check Audit Logs
    logStep(10, "Cek Audit Log untuk tracking aktivitas");
    const auditLogs = await getAuditLogs(adminToken, 1, 5);
    log(`✅ Ditemukan ${auditLogs.logs.length} audit log (5 terakhir)`, "green");
    
    if (auditLogs.logs.length > 0) {
      auditLogs.logs.forEach((log_entry, idx) => {
        log(`   ${idx + 1}. ${log_entry.action} - ${log_entry.resource}`, "yellow");
        log(`      ${log_entry.description}`, "yellow");
        log(`      ${new Date(log_entry.createdAt).toLocaleString("id-ID")}`, "yellow");
      });
    }

    // Summary
    log("\n" + "=".repeat(70), "cyan");
    log("✅ ADMIN SCENARIO - ALL TESTS PASSED!", "green");
    log("=".repeat(70), "cyan");
    
    log("\n📊 TEST SUMMARY:", "blue");
    log("  ✓ Login sebagai Admin", "green");
    log("  ✓ Lihat daftar transaksi PENDING", "green");
    if (pendingData.transactions.length > 0) {
      log("  ✓ Approve transaksi (PENDING → APPROVED)", "green");
      log("  ✓ Verifikasi status APPROVED", "green");
    }
    if (pendingData.transactions.length > 1) {
      log("  ✓ Reject transaksi (PENDING → REJECTED)", "green");
      log("  ✓ Verifikasi status REJECTED", "green");
    }
    log("  ✓ Cek Laporan Pemasukan (W1)", "green");
    log("  ✓ Cek Laporan Pengeluaran (W2)", "green");
    log("  ✓ Cek Laporan Kinerja (W3/W4)", "green");
    log("  ✓ Cek Audit Log", "green");

    log("\n📝 STATISTICS:", "blue");
    log(`  • Pending Transactions: ${pendingData.transactions.length}`, "yellow");
    log(`  • Total Pemasukan: Rp ${(reportSummary.totalRevenue || 0).toLocaleString("id-ID")}`, "yellow");
    log(`  • Total Pengeluaran: Rp ${totalExpenses.toLocaleString("id-ID")}`, "yellow");
    log(`  • Laba Kotor: Rp ${((reportSummary.totalRevenue || 0) - totalExpenses).toLocaleString("id-ID")}`, "yellow");

  } catch (error) {
    log(`\n❌ ADMIN SCENARIO FAILED: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }
}

// Run the scenario
runAdminScenario();
