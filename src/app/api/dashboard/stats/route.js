import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { calculateTransactionFinancials } from "@/lib/accounting";
import { permissions } from "@/lib/middleware";

/**
 * GET /api/dashboard/stats?period=today|month|year
 * Returns:
 * - totalRevenue: sum of all_in_rate + overtime
 * - grossProfit: sum of (revenue - fuel_cost - driver_fee)
 * - transactionCount: count of transactions
 * - fleetCount: count of armadas
 * - transactionTrend: array of { date, count, revenue } for chart
 * - fleetStatus: array of { status, count } for pie chart
 */
async function handleGetDashboardStats(request) {
  try {
    // Check permission
    if (!permissions.canViewDashboard(request.auth.user)) {
      return errorResponse("Insufficient permissions to view dashboard", 403);
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // today | month | year

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Fetch transactions within period
    const transactions = await prisma.transaction.findMany({
      where: {
        booking_date: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        id: true,
        booking_date: true,
        checkout_datetime: true,
        checkin_datetime: true,
        all_in_rate: true,
        overtime_rate_per_hour: true,
        fuel_cost: true,
        driver_fee: true,
        payment_status: true,
        armadaId: true,
        armada: {
          select: {
            license_plate: true,
          },
        },
        package: {
          select: {
            durationHours: true,
          },
        },
      },
      orderBy: {
        booking_date: "asc",
      },
    });

    // Calculate totals using accounting utility
    let totalRevenue = 0;
    let totalOperationalCosts = 0;
    let totalGrossProfit = 0;

    transactions.forEach((t) => {
      const financials = calculateTransactionFinancials(t);
      totalRevenue += financials.totalPendapatan;
      totalOperationalCosts += financials.totalBiayaOps;
      totalGrossProfit += financials.labaKotor;
    });

    const transactionCount = transactions.length;

    // Get fleet count
    const fleetCount = await prisma.armada.count();

    // Get fleet status distribution
    const fleetStatusRaw = await prisma.armada.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const fleetStatus = fleetStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    // Build transaction trend with correct revenue calculation
    const trendMap = new Map();

    transactions.forEach((t) => {
      let key;
      const date = new Date(t.booking_date);

      if (period === "today") {
        // Group by hour
        key = `${date.getHours()}:00`;
      } else if (period === "month") {
        // Group by day
        key = date.toISOString().split("T")[0];
      } else {
        // Group by month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      }

      if (!trendMap.has(key)) {
        trendMap.set(key, { date: key, count: 0, revenue: 0 });
      }

      const entry = trendMap.get(key);
      entry.count += 1;

      // Calculate revenue including overtime
      const financials = calculateTransactionFinancials(t);
      entry.revenue += financials.totalPendapatan;
    });

    const transactionTrend = Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Calculate fleet revenue distribution with correct revenue
    const fleetRevenueMap = new Map();

    transactions.forEach((t) => {
      const licensePlate = t.armada?.license_plate || "Unknown";
      const financials = calculateTransactionFinancials(t);
      const revenue = financials.totalPendapatan;

      if (!fleetRevenueMap.has(licensePlate)) {
        fleetRevenueMap.set(licensePlate, {
          licensePlate,
          revenue: 0,
          transactionCount: 0,
        });
      }

      const entry = fleetRevenueMap.get(licensePlate);
      entry.revenue += revenue;
      entry.transactionCount += 1;
    });

    const fleetRevenue = Array.from(fleetRevenueMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    return successResponse(
      {
        totalRevenue,
        grossProfit: totalGrossProfit,
        transactionCount,
        fleetCount,
        transactionTrend,
        fleetStatus,
        fleetRevenue,
        period,
      },
      "Dashboard stats retrieved successfully"
    );
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return errorResponse(
      "Failed to fetch dashboard stats",
      500,
      error?.message
    );
  }
}

export const GET = protectedRoute(handleGetDashboardStats, {
  roles: ["ADMIN", "MANAGER"],
});
