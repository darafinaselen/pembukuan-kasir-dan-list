import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logExpenseEvent } from "@/lib/audit";

async function handleUpdateExpense(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    // Check permissions
    if (!permissions.canUpdateExpense(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const body = await request.json();
    let finalCategory = body.category;
    if (body.category === "LAINNYA" && body.kategoriLainnya) {
      finalCategory = body.kategoriLainnya;
    }

    const updatedData = await prisma.expense.update({
      where: { id: idFromParams },
      data: {
        date: body.date,
        category: finalCategory,
        description: body.description,
        amount: body.amount,
        armadaId: body.armadaId || null,
        driverId: body.driverId || null,
        staffId: body.staffId || null,
      },
    });

    // Log audit event
    await logExpenseEvent(
      request.auth.user.id,
      "UPDATE",
      updatedData.id,
      updatedData,
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse(updatedData);
  } catch (error) {
    console.error(`Error updating pengeluaran ${idFromParams}:`, error);
    return errorResponse("Gagal mengupdate data", 500);
  }
}

async function handleDeleteExpense(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    // Check permissions
    if (!permissions.canDeleteExpense(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    await prisma.expense.delete({
      where: { id: idFromParams },
    });

    // Log audit event
    await logExpenseEvent(
      request.auth.user.id,
      "DELETE",
      idFromParams,
      null,
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse({ message: "Data berhasil dihapus" });
  } catch (error) {
    console.error(`Error deleting pengeluaran ${idFromParams}:`, error);
    return errorResponse("Gagal menghapus data", 500);
  }
}

// Only ADMIN and MANAGER can update and delete expenses
export const PUT = protectedRoute(handleUpdateExpense, {
  roles: ["ADMIN", "MANAGER"],
});

export const DELETE = protectedRoute(handleDeleteExpense, {
  roles: ["ADMIN", "MANAGER"],
});
