import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
  rateLimitPresets,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { calculateTransactionFinancials } from "@/lib/accounting";
import { logReportAccess } from "@/lib/audit";

/**
 * GET /api/reports/income?from=YYYY-MM-DD&to=YYYY-MM-DD&packageType=CAR_RENTAL|TOUR_PACKAGE|FULL_DAY_TRIP
 * Returns income report grouped by service packages with filtering capabilities
 */
async function handleGetIncomeReport(request) {
  try {
    // Check permissions - only ADMIN can view reports (financial data)
    if (!permissions.canViewReports(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const packageType = url.searchParams.get("packageType"); // Optional filter

    if (!from || !to) {
      return errorResponse("Rentang tanggal wajib diisi", 400);
    }

    // Parse date dan set waktu dengan benar
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Build where clause for transactions
    const whereClause = {
      booking_date: { gte: fromDate, lte: toDate },
      // Only include transactions that have a package (paid services)
      packageId: { not: null },
      approval_status: "APPROVED",
    };

    // Add package type filter if specified
    if (packageType) {
      whereClause.package = {
        type: packageType,
      };
    }

    // Fetch transactions with package details
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
          },
        },
        armada: {
          select: {
            license_plate: true,
            brand: true,
            model: true,
          },
        },
        driver: {
          select: {
            driver_name: true,
          },
        },
      },
      orderBy: {
        booking_date: "desc",
      },
    });

    // Group transactions by package and calculate metrics
    const packageGroups = new Map();

    for (const tx of transactions) {
      if (!tx.package) continue; // Skip if no package (shouldn't happen due to filter)

      const packageId = tx.package.id;
      const packageName = tx.package.name;
      const packageType = tx.package.type;

      if (!packageGroups.has(packageId)) {
        packageGroups.set(packageId, {
          packageId,
          packageName,
          packageType,
          transactionCount: 0,
          totalRevenue: 0,
          totalOvertimeRevenue: 0,
          totalBaseRevenue: 0,
          averageRevenue: 0,
          transactions: [],
        });
      }

      const group = packageGroups.get(packageId);
      const financials = calculateTransactionFinancials(tx);

      group.transactionCount += 1;
      group.totalRevenue += financials.totalPendapatan;
      group.totalOvertimeRevenue += financials.biayaOvertime || 0;
      group.totalBaseRevenue += financials.tarifSewa || 0;
      group.transactions.push({
        id: tx.id,
        invoice_code: tx.invoice_code,
        customer_name: tx.customer_name,
        booking_date: tx.booking_date,
        totalRevenue: financials.totalPendapatan,
        overtimeRevenue: financials.biayaOvertime || 0,
        baseRevenue: financials.tarifSewa || 0,
        armada: tx.armada,
        driver: tx.driver,
      });
    }

    // Convert to array and calculate averages
    const incomeByPackage = Array.from(packageGroups.values()).map((group) => ({
      ...group,
      averageRevenue:
        group.transactionCount > 0
          ? Math.round(group.totalRevenue / group.transactionCount)
          : 0,
    }));

    // Sort by total revenue descending
    incomeByPackage.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate summary statistics
    const summary = {
      totalPackages: incomeByPackage.length,
      totalTransactions: transactions.length,
      totalRevenue: incomeByPackage.reduce(
        (sum, pkg) => sum + pkg.totalRevenue,
        0
      ),
      totalOvertimeRevenue: incomeByPackage.reduce(
        (sum, pkg) => sum + pkg.totalOvertimeRevenue,
        0
      ),
      totalBaseRevenue: incomeByPackage.reduce(
        (sum, pkg) => sum + pkg.totalBaseRevenue,
        0
      ),
      averageRevenuePerPackage:
        incomeByPackage.length > 0
          ? Math.round(
              incomeByPackage.reduce(
                (sum, pkg) => sum + pkg.averageRevenue,
                0
              ) / incomeByPackage.length
            )
          : 0,
    };

    // Log report access for audit trail
    await logReportAccess(
      request.auth.user.id,
      "pemasukan",
      { from, to, packageType },
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse({
      summary,
      incomeByPackage,
      dateRange: { from, to },
      filters: { packageType },
    });
  } catch (error) {
    console.error("Error fetching income report:", error);
    return errorResponse("Gagal memuat laporan pemasukan", 500);
  }
}

// Only ADMIN can view income reports (financial data)
export const GET = protectedRoute(handleGetIncomeReport, {
  roles: ["ADMIN"],
  rateLimit: rateLimitPresets.reports, // 600 requests per minute
});
