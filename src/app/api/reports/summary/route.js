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
    // Check permissions - only ADMIN and MANAGER can view reports
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
      where: dateFilterTx,
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });

    let totalPemasukanSewa = 0;
    let totalBiayaOps = 0;
    let totalLabaKotor = 0;

    const bbmMap = new Map();
    const gajiMap = new Map();

    for (const tx of transactions) {
      const financials = calculateTxFinancials(tx);
      totalPemasukanSewa += financials.totalPendapatan;
      totalBiayaOps += financials.totalBiayaOps;
      totalLabaKotor += financials.labaKotor;

      // Format bulan untuk key dan display
      const bulanKey = format(new Date(tx.booking_date), "yyyy-MM");
      const bulanDisplay = format(new Date(tx.booking_date), "MMMM yyyy", {
        locale: id,
      });

      // Rekap BBM per bulan per armada
      if (tx.armada) {
        const key = `${tx.armadaId}-${bulanKey}`;
        const current = bbmMap.get(key) || {
          armadaId: tx.armadaId,
          bulan: bulanKey,
          bulanDisplay: bulanDisplay,
          platMobil: `${tx.armada.license_plate} (${tx.armada.model})`,
          totalBBM: 0,
        };
        current.totalBBM += tx.fuel_cost || 0;
        bbmMap.set(key, current);
      }

      // Rekap Gaji per bulan per sopir
      if (tx.driver) {
        const key = `${tx.driverId}-${bulanKey}`;
        const current = gajiMap.get(key) || {
          driverId: tx.driverId,
          bulan: bulanKey,
          bulanDisplay: bulanDisplay,
          namaSopir: tx.driver.driver_name,
          totalGaji: 0,
        };
        current.totalGaji += tx.driver_fee || 0;
        gajiMap.set(key, current);
      }
    }

    const expenseAggregation = await prisma.expense.aggregate({
      where: dateFilterEx,
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

    // Sort rekap by bulan descending (newest first)
    const rekapBBM = Array.from(bbmMap.values()).sort((a, b) =>
      b.bulan.localeCompare(a.bulan)
    );

    const rekapGaji = Array.from(gajiMap.values()).sort((a, b) =>
      b.bulan.localeCompare(a.bulan)
    );

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
      rekapBBM,
      rekapGaji,
    });
  } catch (error) {
    console.error("Error fetching report data:", error);
    return errorResponse("Gagal memuat data laporan", 500);
  }
}

// Only ADMIN and MANAGER can view reports
// Use reports rate limit for flexible data viewing
export const GET = protectedRoute(handleGetSummaryReport, {
  roles: ["ADMIN", "MANAGER"],
  rateLimit: rateLimitPresets.reports, // 600 requests per minute
});
