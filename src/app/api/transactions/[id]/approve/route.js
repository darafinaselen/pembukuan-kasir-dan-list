import { prisma } from "@/lib/prisma";
import { protectedRoute } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/utils";
import { logTransactionEvent } from "@/lib/audit";

/**
 * POST /api/transactions/[id]/approve
 * Approve a pending transaction (ADMIN/MANAGER only)
 * Changes status from PENDING to APPROVED
 */
async function handleApproveTransaction(request, { params }) {
  try {
    const { id } = params;
    const user = request.user;

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

    // Update status to APPROVED
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        approval_status: "APPROVED",
        approved_at: new Date(),
        approved_by: user.email,
      },
      include: {
        armada: true,
        driver: true,
        package: true,
      },
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
    return errorResponse(error.message || "Gagal menyetujui transaksi", 500);
  }
}

export const POST = protectedRoute(handleApproveTransaction, [
  "ADMIN",
  "MANAGER",
]);
