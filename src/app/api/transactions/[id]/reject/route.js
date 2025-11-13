import { prisma } from "@/lib/prisma";
import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";
import { logTransactionEvent } from "@/lib/audit";

/**
 * POST /api/transactions/[id]/reject
 * Reject a pending transaction (ADMIN only)
 * Changes status from PENDING to REJECTED with reason
 */
async function handleRejectTransaction(request, context) {
  try {
    const { id } = await context.params;
    const user = request.auth.user;
    const body = await request.json();
    const { rejection_reason } = body;

    // Validate rejection reason
    if (!rejection_reason || rejection_reason.trim() === "") {
      return errorResponse("Alasan penolakan harus diisi", 400);
    }

    // Verify transaction exists and is in PENDING status
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        armada: true,
        driver: true,
        package: true,
      },
    });

    if (!transaction) {
      return errorResponse("Transaksi tidak ditemukan", 404);
    }

    if (transaction.approval_status !== "PENDING") {
      return errorResponse(
        `Transaksi tidak dapat ditolak. Status saat ini: ${transaction.approval_status}`,
        400
      );
    }

    // Use atomic transaction to update transaction status and release resources
    // This ensures resources are immediately available again after rejection
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // 1. Update transaction status to REJECTED with reason
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          approval_status: "REJECTED",
          rejected_at: new Date(),
          rejected_by: user.email,
          rejection_reason: rejection_reason.trim(),
        },
        include: {
          armada: true,
          driver: true,
          package: true,
        },
      });

      // 2. Release armada by resetting status to READY
      // This prevents permanent resource leak when transaction is rejected
      await tx.armada.update({
        where: { id: transaction.armadaId },
        data: { status: "READY" },
      });

      // 3. Release driver by resetting status to READY
      // This prevents permanent resource leak when transaction is rejected
      await tx.driver.update({
        where: { id: transaction.driverId },
        data: { status: "READY" },
      });

      return updated;
    });

    // Log the rejection
    await logTransactionEvent(user, "REJECT", updatedTransaction, request);

    return successResponse(
      {
        transaction: updatedTransaction,
        message: "Transaksi berhasil ditolak",
      },
      200
    );
  } catch (error) {
    console.error("Reject transaction error:", error);
    return errorResponse(error.message || "Gagal menolak transaksi", 500);
  }
}

export const POST = protectedRoute(handleRejectTransaction, ["ADMIN"]);
