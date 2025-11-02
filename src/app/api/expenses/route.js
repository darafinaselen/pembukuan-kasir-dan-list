import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logExpenseEvent } from "@/lib/audit";

async function handleGetExpenses(request) {
  try {
    // Check permissions
    if (!permissions.canViewExpenses(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const data = await prisma.expense.findMany({
      orderBy: {
        date: "desc",
      },
    });
    return successResponse(data);
  } catch (error) {
    console.error("Error fetching pengeluaran:", error);
    return errorResponse("Gagal mengambil data", 500);
  }
}

async function handleCreateExpense(request) {
  try {
    // Check permissions
    if (!permissions.canCreateExpense(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const body = await request.json();

    if (!body.date || !body.category || !body.description || !body.amount) {
      return errorResponse("Data tidak lengkap", 400);
    }

    const newData = await prisma.expense.create({
      data: {
        date: body.date,
        category: body.category,
        description: body.description,
        amount: body.amount,
        armadaId: body.armadaId,
      },
    });

    // Log audit event
    await logExpenseEvent(
      request.auth.user.id,
      "CREATE",
      newData.id,
      newData,
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse(newData, 201);
  } catch (error) {
    console.error("Error creating pengeluaran:", error);
    return errorResponse("Gagal membuat data", 500);
  }
}

// Only ADMIN and MANAGER can view and create expenses
export const GET = protectedRoute(handleGetExpenses, {
  roles: ["ADMIN", "MANAGER"],
});

export const POST = protectedRoute(handleCreateExpense, {
  roles: ["ADMIN", "MANAGER"],
});
