import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { calculateTransactionFinancials } from "@/lib/accounting";
import { permissions } from "@/lib/middleware";

/**
 * GET /api/dashboard/driver-performance?period=today|month|year&drivers=driverId1,driverId2
 * Returns driver performance metrics for the specified period and drivers
 */
async function handleGetDriverPerformance(request) {
  try {
    const user = request.auth.user;
    // Check permission
    // if (!permissions.canViewDashboard(request.auth.user)) {
    //   return errorResponse(
    //     "Insufficient permissions to view driver performance",
    //     403
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const driverIdsParam = searchParams.get("drivers");
    const driverIds = driverIdsParam
      ? driverIdsParam.split(",").filter((id) => id.trim())
      : null;

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

    // Build where clause for transactions
    const whereClause = {
      booking_date: {
        gte: startDate,
        lte: now,
      },
      approval_status: "APPROVED",
      // Only include completed transactions
      actual_checkin_datetime: { not: null },
    };

    // Add driver filter if specified
    if (driverIds && driverIds.length > 0) {
      whereClause.driverId = { in: driverIds };
    }

    // Fetch transactions with driver info
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        id: true,
        booking_date: true,
        checkout_datetime: true,
        checkin_datetime: true,
        actual_checkin_datetime: true,
        all_in_rate: true,
        overtime_rate_per_hour: true,
        payment_status: true,
        driverId: true,
        driver: {
          select: {
            id: true,
            driver_name: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            durationHours: true,
            hotelTiers: {
              select: {
                id: true,
                priceRanges: {
                  select: {
                    minPax: true,
                    maxPax: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
        hotel_tier_id: true,
        pax_count: true,
        custom_price: true,
      },
      orderBy: {
        booking_date: "asc",
      },
    });

    // Get all drivers (for filtering options)
    const allDrivers = await prisma.driver.findMany({
      select: {
        id: true,
        driver_name: true,
        status: true,
      },
      orderBy: { driver_name: "asc" },
    });

    // Calculate performance metrics per driver
    const driverPerformanceMap = new Map();

    const isAdmin = user.role === "ADMIN";

    transactions.forEach((transaction) => {
      const driverId = transaction.driverId;
      const driverName = transaction.driver?.driver_name || "Unknown Driver";

      if (!driverPerformanceMap.has(driverId)) {
        driverPerformanceMap.set(driverId, {
          driverId,
          driverName,
          tripCount: 0,
          onTimeCount: 0,
          totalTrips: 0,
          totalIncome: 0,
          onTimeRate: 0,
        });
      }

      const driverData = driverPerformanceMap.get(driverId);
      // const financials = calculateTransactionFinancials(transaction);

      // Increment trip count
      driverData.tripCount += 1;

      // Calculate on-time delivery
      // Consider on-time if actual return is within 2 hours of planned return
      const plannedReturn = new Date(transaction.checkin_datetime);
      const actualReturn = new Date(transaction.actual_checkin_datetime);
      const timeDiff = Math.abs(actualReturn - plannedReturn);
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff <= 2) {
        // 2-hour tolerance
        driverData.onTimeCount += 1;
      }

      // Add income
      if (isAdmin) {
        const financials = calculateTransactionFinancials(transaction);
        driverData.totalIncome += financials.totalPendapatan;
      }
    });

    // Calculate final metrics and convert to array
    const driverPerformance = Array.from(driverPerformanceMap.values()).map(
      (driver) => ({
        ...driver,
        onTimeRate:
          driver.tripCount > 0
            ? (driver.onTimeCount / driver.tripCount) * 100
            : 0,
      })
    );

    // Sort by trip count descending
    driverPerformance.sort((a, b) => b.tripCount - a.tripCount);

    return successResponse(
      {
        driverPerformance,
        allDrivers,
        period,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: now.toISOString().split("T")[0],
        },
        summary: {
          totalDrivers: driverPerformance.length,
          totalTrips: driverPerformance.reduce(
            (sum, d) => sum + d.tripCount,
            0
          ),
          averageOnTimeRate:
            driverPerformance.length > 0
              ? driverPerformance.reduce((sum, d) => sum + d.onTimeRate, 0) /
                driverPerformance.length
              : 0,
          totalIncome: driverPerformance.reduce(
            (sum, d) => sum + d.totalIncome,
            0
          ),
        },
      },
      "Driver performance data retrieved successfully"
    );
  } catch (error) {
    console.error("Driver performance error:", error);
    return errorResponse(
      "Failed to fetch driver performance data",
      500,
      error?.message
    );
  }
}

export const GET = protectedRoute(handleGetDriverPerformance, {
  roles: ["ADMIN", "OPERATOR"],
});
