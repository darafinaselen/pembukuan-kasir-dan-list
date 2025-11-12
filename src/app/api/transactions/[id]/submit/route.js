import { prisma } from "@/lib/prisma";
import { protectedRoute } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/utils";
import { logTransactionEvent } from "@/lib/audit";

/**
 * POST /api/transactions/[id]/submit
 * Submit transaction for approval (OPERATOR only)
 * Changes status from DRAFT to PENDING
 */
async function handleSubmitTransaction(request, { params }) {
  try {
    const { id } = params;
    const user = request.user;

    // Verify transaction exists and is in DRAFT status
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

    if (transaction.approval_status !== "DRAFT") {
      return errorResponse(
        `Transaksi tidak dapat diajukan. Status saat ini: ${transaction.approval_status}`,
        400
      );
    }

    // Update status to PENDING
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        approval_status: "PENDING",
        submitted_at: new Date(),
        submitted_by: user.email,
      },
      include: {
        armada: true,
        driver: true,
        package: true,
      },
    });

    // Log the submission
    await logTransactionEvent(
      user,
      "SUBMIT_APPROVAL",
      updatedTransaction,
      request
    );

    return successResponse(
      {
        transaction: updatedTransaction,
        message: "Transaksi berhasil diajukan untuk persetujuan",
      },
      200
    );
  } catch (error) {
    console.error("Submit transaction error:", error);
    return errorResponse(
      error.message || "Gagal mengajukan transaksi untuk persetujuan",
      500
    );
  }
}

export const POST = protectedRoute(handleSubmitTransaction, [
  "ADMIN",
  "MANAGER",
  "OPERATOR",
]);
