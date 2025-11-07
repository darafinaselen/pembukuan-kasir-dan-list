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

    // Validate amount is a number
    const amount =
      typeof body.amount === "number" ? body.amount : parseInt(body.amount, 10);
    if (isNaN(amount) || amount <= 0) {
      return errorResponse(
        "Jumlah harus berupa angka yang valid dan lebih dari 0",
        400
      );
    }

    let finalCategory = body.category;
    if (body.category === "LAINNYA" && body.kategoriLainnya) {
      finalCategory = body.kategoriLainnya;
    }

    // Build the update data object with proper Prisma relations
    const updateData = {
      date: body.date,
      paymentMonth: body.paymentMonth || null,
      category: finalCategory,
      description: body.description,
      amount: amount,
    };

    // Handle optional relations - disconnect if null, connect if provided
    if (body.armadaId === null) {
      updateData.armada = { disconnect: true };
    } else if (body.armadaId) {
      updateData.armada = { connect: { id: body.armadaId } };
    }

    if (body.driverId === null) {
      updateData.driver = { disconnect: true };
    } else if (body.driverId) {
      updateData.driver = { connect: { id: body.driverId } };
    }

    if (body.staffId === null) {
      updateData.staff = { disconnect: true };
    } else if (body.staffId) {
      updateData.staff = { connect: { id: body.staffId } };
    }

    const updatedData = await prisma.expense.update({
      where: { id: idFromParams },
      data: updateData,
      include: {
        armada: true,
        driver: true,
        staff: true,
        attachments: true,
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
