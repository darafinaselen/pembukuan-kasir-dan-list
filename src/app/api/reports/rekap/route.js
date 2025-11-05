import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

async function handleGetRekap(request) {
  try {
    // Check permissions
    if (!permissions.canViewReports(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return errorResponse("startDate dan endDate wajib diisi", 400);
    }

    // Fetch expenses within date range
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Group expenses by category and month
    const rekapByCategory = {};

    expenses.forEach((expense) => {
      const category = expense.category;
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!rekapByCategory[category]) {
        rekapByCategory[category] = {};
      }

      if (!rekapByCategory[category][monthKey]) {
        rekapByCategory[category][monthKey] = {
          month: monthKey,
          category: category,
          total: 0,
          count: 0,
          items: [],
        };
      }

      rekapByCategory[category][monthKey].total += expense.amount;
      rekapByCategory[category][monthKey].count += 1;
      rekapByCategory[category][monthKey].items.push({
        id: expense.id,
        date: expense.date,
        description: expense.description,
        amount: expense.amount,
        armadaId: expense.armadaId,
      });
    });

    // Convert to array format for easier frontend consumption
    const rekapData = Object.keys(rekapByCategory).map((category) => {
      const months = Object.values(rekapByCategory[category]);
      return {
        category,
        months: months.sort((a, b) => a.month.localeCompare(b.month)),
        totalAmount: months.reduce((sum, m) => sum + m.total, 0),
        totalCount: months.reduce((sum, m) => sum + m.count, 0),
      };
    });

    return successResponse({
      rekap: rekapData,
      summary: {
        totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
        totalTransactions: expenses.length,
        categories: Object.keys(rekapByCategory).length,
      },
    });
  } catch (error) {
    console.error("Error fetching rekap:", error);
    return errorResponse("Gagal mengambil data rekapitulasi", 500);
  }
}

// Only ADMIN and MANAGER can view rekap reports
export const GET = protectedRoute(handleGetRekap, {
  roles: ["ADMIN", "MANAGER"],
});
