import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
  rateLimitPresets,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { calculateTransactionFinancials } from "@/lib/accounting";
import { logReportAccess } from "@/lib/audit";

/**
 * Calculate financial metrics for a transaction
 * Uses centralized accounting utility for consistency
 * @deprecated Use calculateTransactionFinancials from @/lib/accounting instead
 */
function calculateTxFinancials(tx) {
  return calculateTransactionFinancials(tx);
}

async function handleGetSummaryReport(request) {
  try {
    // Check permissions - only ADMIN can view reports (financial data)
    if (!permissions.canViewReports(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      return errorResponse("Rentang tanggal wajib diisi", 400);
    }

    // Parse date dan set waktu dengan benar
    // from: start of day (00:00:00)
    // to: end of day (23:59:59)
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const dateFilterTx = {
      booking_date: { gte: fromDate, lte: toDate },
    };
    const dateFilterEx = { date: { gte: fromDate, lte: toDate } };

    const transactions = await prisma.transaction.findMany({
      where: {
        ...dateFilterTx,
        approval_status: "APPROVED",
        OR: [
          // Include completed transactions (have actual_checkin_datetime)
          { actual_checkin_datetime: { not: null } },
          // Include transactions with down payment
          {
            AND: [
              { payment_status: "DOWN_PAYMENT" },
              { dp_amount: { gt: 0 } }
            ]
          }
        ]
      },
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });

    let totalPemasukanSewa = 0;
    let totalBiayaOps = 0; // operational costs from tx-level fields removed
    let totalLabaKotor = 0;

    for (const tx of transactions) {
      const financials = calculateTxFinancials(tx);
      totalPemasukanSewa += financials.totalPendapatan;
      totalBiayaOps += financials.totalBiayaOps;
      totalLabaKotor += financials.labaKotor;

      // BBM and driver fee are removed from transaction-level; skip rekap accumulation
    }

    const expenseAggregation = await prisma.expense.aggregate({
      where: {
        ...dateFilterEx,
        approval_status: "APPROVED",
      },
      _sum: {
        amount: true,
      },
    });

    const totalBiayaKantor = expenseAggregation._sum.amount || 0;

    const laporanTransaksi = {
      totalTransaksi: transactions.length,
      totalPemasukan: totalPemasukanSewa,
      totalPengeluaranOps: totalBiayaOps,
      totalLabaKotor: totalLabaKotor,
    };

    const laporanLabaRugi = {
      totalPemasukanSewa: totalPemasukanSewa,
      totalBiayaOps: totalBiayaOps,
      totalBiayaKantor: totalBiayaKantor,
      labaRugiBersih: totalPemasukanSewa - totalBiayaOps - totalBiayaKantor,
      status:
        totalPemasukanSewa - totalBiayaOps - totalBiayaKantor >= 0
          ? "PROFIT"
          : "LOSS",
      profitMargin:
        totalPemasukanSewa > 0
          ? (
              ((totalPemasukanSewa - totalBiayaOps - totalBiayaKantor) /
                totalPemasukanSewa) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };

    // Log report access for audit trail
    await logReportAccess(
      request.auth.user.id,
      "ringkasan",
      { from, to },
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse({
      laporanTransaksi,
      laporanLabaRugi,
    });
  } catch (error) {
    console.error("Error fetching report data:", error);
    return errorResponse("Gagal memuat data laporan", 500);
  }
}

// Only ADMIN can view reports (financial data)
// Use reports rate limit for flexible data viewing
export const GET = protectedRoute(handleGetSummaryReport, {
  roles: ["ADMIN"],
  rateLimit: rateLimitPresets.reports, // 600 requests per minute
});
