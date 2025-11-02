import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logTransactionEvent } from "@/lib/audit";

async function handleGetTransaction(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    // Check permissions
    if (!permissions.canViewTransactions(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: idFromParams },
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });

    if (!transaction) {
      return errorResponse("Transaksi tidak ditemukan", 404);
    }

    return successResponse(transaction);
  } catch (error) {
    console.error(`Error fetching transaction ${idFromParams}:`, error);
    return errorResponse("Gagal mengambil data", 500);
  }
}

async function handleUpdateTransaction(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    // Check permissions
    if (!permissions.canUpdateTransaction(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const body = await request.json();
    const { armadaId, driverId, packageId, ...transactionData } = body;

    const updatedTransaction = await prisma.transaction.update({
      where: { id: idFromParams },
      data: {
        ...transactionData,
        armadaId: armadaId,
        driverId: driverId,
        packageId: packageId || null,
      },
    });

    // Log audit event
    await logTransactionEvent(
      request.auth.user.id,
      "UPDATE",
      updatedTransaction.id,
      updatedTransaction,
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse(updatedTransaction);
  } catch (error) {
    console.error(`Error updating transaction ${idFromParams}:`, error);
    return errorResponse("Gagal mengupdate data", 500);
  }
}

async function handleDeleteTransaction(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    // Check permissions
    if (!permissions.canDeleteTransaction(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const tx = await prisma.transaction.findUnique({
      where: { id: idFromParams },
      select: { armadaId: true, driverId: true },
    });

    if (!tx) {
      return errorResponse("Transaksi tidak ditemukan", 404);
    }

    await prisma.$transaction([
      prisma.transaction.delete({
        where: { id: idFromParams },
      }),

      prisma.armada.update({
        where: { id: tx.armadaId },
        data: { status: "READY" },
      }),

      prisma.driver.update({
        where: { id: tx.driverId },
        data: { status: "READY" },
      }),
    ]);

    // Log audit event
    await logTransactionEvent(
      request.auth.user.id,
      "DELETE",
      idFromParams,
      { armadaId: tx.armadaId, driverId: tx.driverId },
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse({
      message:
        "Data transaksi berhasil dihapus dan status armada/sopir di-reset",
    });
  } catch (error) {
    console.error(`Error deleting transaction ${idFromParams}:`, error);
    return errorResponse("Gagal menghapus data", 500);
  }
}

// All roles can view transactions
export const GET = protectedRoute(handleGetTransaction, {
  roles: ["ADMIN", "MANAGER", "OPERATOR"],
});

// All roles can update transactions
export const PUT = protectedRoute(handleUpdateTransaction, {
  roles: ["ADMIN", "MANAGER", "OPERATOR"],
});

// Only ADMIN and MANAGER can delete transactions
export const DELETE = protectedRoute(handleDeleteTransaction, {
  roles: ["ADMIN", "MANAGER"],
});
