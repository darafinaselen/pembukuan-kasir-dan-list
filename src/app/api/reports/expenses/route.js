import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reports/expenses
 * Get expense reports with pivot/grouping functionality
 * Query parameters:
 * - startDate: Start date filter (YYYY-MM-DD)
 * - endDate: End date filter (YYYY-MM-DD)
 * - paymentMonth: Filter by payment month (YYYY-MM-DD)
 * - category: Filter by specific category
 * - groupBy: 'category' (default) or 'month' for different grouping
 */
export async function GET(request) {
  try {
    // Check permissions
    if (!permissions.canViewExpenses(request.auth?.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentMonth = searchParams.get("paymentMonth");
    const category = searchParams.get("category");
    const groupBy = searchParams.get("groupBy") || "category"; // 'category' or 'month'

    // Build where clause
    const where = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate),
      };
    }

    if (paymentMonth) {
      where.paymentMonth = new Date(paymentMonth);
    }

    if (category) {
      where.category = category;
    }

    // Get all expenses with filters
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        armada: {
          select: { id: true, license_plate: true, brand: true, model: true },
        },
        driver: {
          select: { id: true, driver_name: true, nik: true },
        },
        staff: {
          select: { id: true, name: true, position: true },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Group expenses based on groupBy parameter
    let groupedData = {};

    if (groupBy === "month") {
      // Group by month (YYYY-MM format)
      groupedData = expenses.reduce((acc, expense) => {
        const monthKey = expense.date.toISOString().substring(0, 7); // YYYY-MM

        if (!acc[monthKey]) {
          acc[monthKey] = {
            period: monthKey,
            totalAmount: 0,
            categories: {},
            expenses: [],
          };
        }

        acc[monthKey].totalAmount += expense.amount;
        acc[monthKey].expenses.push(expense);

        // Also group by category within each month
        if (!acc[monthKey].categories[expense.category]) {
          acc[monthKey].categories[expense.category] = {
            category: expense.category,
            totalAmount: 0,
            count: 0,
            expenses: [],
          };
        }

        acc[monthKey].categories[expense.category].totalAmount +=
          expense.amount;
        acc[monthKey].categories[expense.category].count += 1;
        acc[monthKey].categories[expense.category].expenses.push(expense);

        return acc;
      }, {});
    } else {
      // Default: Group by category
      groupedData = expenses.reduce((acc, expense) => {
        const categoryKey = expense.category;

        if (!acc[categoryKey]) {
          acc[categoryKey] = {
            category: categoryKey,
            totalAmount: 0,
            count: 0,
            expenses: [],
          };
        }

        acc[categoryKey].totalAmount += expense.amount;
        acc[categoryKey].count += 1;
        acc[categoryKey].expenses.push(expense);

        return acc;
      }, {});
    }

    // Convert to array and calculate summary
    const groupedArray = Object.values(groupedData);
    const summary = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      categoriesCount:
        groupBy === "category"
          ? groupedArray.length
          : Object.keys(groupedArray[0]?.categories || {}).length,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      filters: {
        paymentMonth: paymentMonth || null,
        category: category || null,
        groupBy,
      },
    };

    return successResponse({
      summary,
      data: groupedArray,
      rawExpenses: expenses, // Include raw data for detailed view
    });
  } catch (error) {
    console.error("Error generating expense report:", error);
    return errorResponse("Gagal membuat laporan pengeluaran", 500);
  }
}
