import { prisma } from "@/lib/prisma";
import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { logTransactionEvent } from "@/lib/audit";

/**
 * POST /api/transactions/[id]/approve
 * Approve a pending transaction (ADMIN only)
 * Changes status from PENDING to APPROVED
 */
async function handleApproveTransaction(request, context) {
  try {
    // Check permissions
    if (!permissions.canApproveTransaction(request.auth.user)) {
      return errorResponse("Insufficient permissions to approve transaction", 403);
    }
    
    const { id } = await context.params;
    const user = request.auth.user;

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
        `Transaksi tidak dapat disetujui. Status saat ini: ${transaction.approval_status}`,
        400
      );
    }

    // Determine resource status dynamically based on checkout_datetime at approval time
    // This ensures status is accurate even if approval happens on a different date than creation
    const isStartingTodayOrPast =
      new Date(transaction.checkout_datetime) <= new Date();
    const armadaStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";
    const driverStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";

    // Use atomic transaction to update transaction status and lock resources
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // 1. Verify armada and driver are available (READY status)
      // This prevents double-booking if resources were changed between creation and approval
      const armada = await tx.armada.findFirst({
        where: {
          id: transaction.armadaId,
          status: "READY",
        },
      });

      if (!armada) {
        throw new Error(
          "Armada tidak tersedia untuk disetujui. Status armada mungkin sudah berubah."
        );
      }

      const driver = await tx.driver.findFirst({
        where: {
          id: transaction.driverId,
          status: "READY",
        },
      });

      if (!driver) {
        throw new Error(
          "Sopir tidak tersedia untuk disetujui. Status sopir mungkin sudah berubah."
        );
      }

      // 2. Update transaction status to APPROVED
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          approval_status: "APPROVED",
          approved_at: new Date(),
          approved_by_id: user.id,
        },
        include: {
          armada: true,
          driver: true,
          package: true,
        },
      });

      // 3. Lock armada by updating its status
      await tx.armada.update({
        where: { id: transaction.armadaId },
        data: { status: armadaStatus },
      });

      // 4. Lock driver by updating its status
      await tx.driver.update({
        where: { id: transaction.driverId },
        data: { status: driverStatus },
      });

      return updated;
    });

    // Log the approval
    await logTransactionEvent(user, "APPROVE", updatedTransaction, request);

    return successResponse(
      {
        transaction: updatedTransaction,
        message: "Transaksi berhasil disetujui",
      },
      200
    );
  } catch (error) {
    console.error("Approve transaction error:", error);

    // Handle availability conflicts
    if (error.message && error.message.includes("tidak tersedia")) {
      return errorResponse(error.message, 409);
    }

    return errorResponse(error.message || "Gagal menyetujui transaksi", 500);
  }
}

export const POST = protectedRoute(handleApproveTransaction, ["ADMIN"]);
