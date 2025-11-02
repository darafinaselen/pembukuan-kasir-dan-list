import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logTransactionEvent } from "@/lib/audit";

async function handleUpdatePaymentStatus(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    // Check permissions
    if (!permissions.canUpdateTransaction(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const { payment_status } = await request.json();

    if (
      !payment_status ||
      !["UNPAID", "DOWN_PAYMENT", "PAID"].includes(payment_status)
    ) {
      return errorResponse("Status pembayaran tidak valid", 400);
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: idFromParams },
      data: {
        payment_status: payment_status,
      },
    });

    // Log audit event
    await logTransactionEvent(
      request.auth.user.id,
      "UPDATE",
      updatedTransaction.id,
      { payment_status },
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse(updatedTransaction);
  } catch (error) {
    console.error(`Error updating payment status ${idFromParams}:`, error);
    return errorResponse("Gagal mengupdate status", 500);
  }
}

// All roles can update payment status
export const PUT = protectedRoute(handleUpdatePaymentStatus, {
  roles: ["ADMIN", "MANAGER", "OPERATOR"],
});
