import {
  protectedRoute,
  successResponse,
  errorResponse,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logReportAccess } from "@/lib/audit";

/**
 * GET /api/reports/performance
 * Laporan Kinerja Sopir dan Paket Jasa
 *
 * Query params:
 * - from: YYYY-MM-DD (required)
 * - to: YYYY-MM-DD (required)
 */
async function handleGetPerformanceReport(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    if (!fromStr || !toStr) {
      return errorResponse("from dan to parameter wajib diisi", 400);
    }

    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    toDate.setHours(23, 59, 59, 999); // End of day

    // Fetch transactions within date range
    const transactions = await prisma.transaction.findMany({
      where: {
        booking_date: {
          gte: fromDate,
          lte: toDate,
        },
        approval_status: "APPROVED",
      },
      select: {
        id: true,
        booking_date: true,
        checkout_datetime: true,
        checkin_datetime: true,
        actual_checkin_datetime: true,
        driver: {
          select: {
            id: true,
            driver_name: true,
            phone_number: true,
          },
        },
        driverId: true,
        package: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        packageId: true,
      },
      orderBy: {
        booking_date: "asc",
      },
    });

    // Calculate Driver Performance
    const driverPerformanceMap = new Map();

    transactions.forEach((t) => {
      if (!t.driver) return;

      const driverId = t.driver.id;
      const driverName = t.driver.driver_name;

      if (!driverPerformanceMap.has(driverId)) {
        driverPerformanceMap.set(driverId, {
          driverId,
          driverName,
          phoneNumber: t.driver.phone_number,
          totalTrips: 0,
          completedTrips: 0,
          totalWorkingHours: 0,
        });
      }

      const driver = driverPerformanceMap.get(driverId);
      driver.totalTrips += 1;

      // Calculate working hours
      const checkout = new Date(t.checkout_datetime);
      const checkin = t.actual_checkin_datetime
        ? new Date(t.actual_checkin_datetime)
        : new Date(t.checkin_datetime);

      const hours = Math.max(
        0,
        (checkin.getTime() - checkout.getTime()) / (1000 * 60 * 60)
      );

      driver.totalWorkingHours += hours;

      if (t.actual_checkin_datetime) {
        driver.completedTrips += 1;
      }
    });

    const driverPerformance = Array.from(driverPerformanceMap.values())
      .map((driver) => {
        const averageHoursPerTrip =
          driver.totalTrips > 0
            ? parseFloat(
                (driver.totalWorkingHours / driver.totalTrips).toFixed(2)
              )
            : 0;
        const completionRate =
          driver.totalTrips > 0
            ? parseFloat(
                ((driver.completedTrips / driver.totalTrips) * 100).toFixed(1)
              )
            : 0;

        return {
          ...driver,
          averageHoursPerTrip,
          completionRate,
        };
      })
      .sort((a, b) => b.totalTrips - a.totalTrips);

    // Calculate Package Performance
    const packagePerformanceMap = new Map();

    transactions.forEach((t) => {
      if (!t.package) return;

      const packageId = t.package.id;
      const packageName = t.package.name;
      const packageType = t.package.type;

      if (!packagePerformanceMap.has(packageId)) {
        packagePerformanceMap.set(packageId, {
          packageId,
          packageName,
          packageType,
          frequency: 0,
          totalTrips: 0,
        });
      }

      const pkg = packagePerformanceMap.get(packageId);
      pkg.frequency += 1;
      pkg.totalTrips += 1;
    });

    const packagePerformance = Array.from(packagePerformanceMap.values())
      .map((pkg) => ({
        ...pkg,
        frequency: pkg.frequency,
      }))
      .sort((a, b) => b.frequency - a.frequency);

    // Log report access
    await logReportAccess(
      request.auth.user.id,
      "Performance Report",
      { from: fromStr, to: toStr },
      getClientIp(request),
      getUserAgent(request)
    );

    return successResponse({
      driverPerformance,
      packagePerformance,
      summary: {
        totalDrivers: driverPerformance.length,
        totalPackages: packagePerformance.length,
        totalTrips: transactions.length,
        period: {
          from: fromStr,
          to: toStr,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching performance report:", error);
    return errorResponse("Gagal mengambil data laporan kinerja", 500);
  }
}

export const GET = protectedRoute(handleGetPerformanceReport, {
  roles: ["ADMIN"],
});
