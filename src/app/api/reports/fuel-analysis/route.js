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
 * GET /api/reports/fuel-analysis
 * Analisis Konsumsi BBM per Armada
 *
 * Query params:
 * - from: YYYY-MM-DD (required)
 * - to: YYYY-MM-DD (required)
 */
async function handleGetFuelAnalysis(request) {
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

    // Fetch fuel expenses (BBM) within date range
    const fuelExpenses = await prisma.expense.findMany({
      where: {
        category: "BBM",
        date: {
          gte: fromDate,
          lte: toDate,
        },
        approval_status: "APPROVED",
      },
      include: {
        armada: {
          select: {
            id: true,
            brand: true,
            model: true,
            license_plate: true,
          },
        },
        driver: {
          select: {
            id: true,
            driver_name: true,
          },
        },
        staff: {
          select: {
            id: true,
            staff_name: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Get transactions for each armada to calculate average per trip
    const armadaIds = [
      ...new Set(fuelExpenses.filter((e) => e.armadaId).map((e) => e.armadaId)),
    ];

    const transactionCounts = await Promise.all(
      armadaIds.map(async (armadaId) => {
        const count = await prisma.transaction.count({
          where: {
            armadaId,
            booking_date: {
              gte: fromDate,
              lte: toDate,
            },
          },
        });
        return { armadaId, count };
      })
    );

    const tripCountMap = new Map(
      transactionCounts.map((t) => [t.armadaId, t.count])
    );

    // Calculate Fuel Analysis per Armada
    const armadaFuelMap = new Map();

    fuelExpenses.forEach((expense) => {
      if (!expense.armada) return;

      const armadaId = expense.armada.id;

      if (!armadaFuelMap.has(armadaId)) {
        armadaFuelMap.set(armadaId, {
          armadaId,
          armadaName: `${expense.armada.brand} ${expense.armada.model}`,
          licensePlate: expense.armada.license_plate,
          totalAmount: 0,
          totalFuelCost: 0,
          refuelCount: 0,
          totalTrips: tripCountMap.get(armadaId) || 0,
          expenses: [],
        });
      }

      const armada = armadaFuelMap.get(armadaId);
      armada.totalAmount += expense.amount || 0;
      armada.totalFuelCost += expense.amount || 0;
      armada.refuelCount += 1;
      armada.expenses.push({
        date: expense.date,
        amount: expense.amount,
        description: expense.description,
      });
    });

    const fuelAnalysis = Array.from(armadaFuelMap.values())
      .map((armada) => {
        const averageCostPerTrip =
          armada.totalTrips > 0
            ? parseFloat((armada.totalFuelCost / armada.totalTrips).toFixed(0))
            : 0;
        const averageCostPerRefuel =
          armada.refuelCount > 0
            ? parseFloat((armada.totalFuelCost / armada.refuelCount).toFixed(0))
            : 0;

        return {
          armadaId: armada.armadaId,
          armadaName: armada.armadaName,
          licensePlate: armada.licensePlate,
          totalFuelCost: armada.totalFuelCost,
          refuelCount: armada.refuelCount,
          totalTrips: armada.totalTrips,
          averageCostPerTrip,
          averageCostPerRefuel,
        };
      })
      .sort((a, b) => b.totalFuelCost - a.totalFuelCost);

    // Calculate summary
    const totalFuelCost = fuelAnalysis.reduce(
      (sum, armada) => sum + armada.totalFuelCost,
      0
    );
    const totalRefuels = fuelAnalysis.reduce(
      (sum, armada) => sum + armada.refuelCount,
      0
    );
    const totalTrips = fuelAnalysis.reduce(
      (sum, armada) => sum + armada.totalTrips,
      0
    );
    const averageCostPerArmada =
      fuelAnalysis.length > 0
        ? parseFloat((totalFuelCost / fuelAnalysis.length).toFixed(0))
        : 0;

    // Log report access
    await logReportAccess(
      request.auth.user.id,
      "Fuel Analysis Report",
      { from: fromStr, to: toStr },
      getClientIp(request),
      getUserAgent(request)
    );

    return successResponse({
      fuelAnalysis,
      summary: {
        totalArmada: fuelAnalysis.length,
        totalFuelCost,
        totalRefuels,
        totalTrips,
        averageCostPerArmada,
        period: {
          from: fromStr,
          to: toStr,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching fuel analysis:", error);
    return errorResponse("Gagal mengambil data analisis BBM", 500);
  }
}

export const GET = protectedRoute(handleGetFuelAnalysis, {
  roles: ["ADMIN"],
});
