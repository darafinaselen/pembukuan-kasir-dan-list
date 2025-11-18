import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/transactions/status/[id]
 * Update payment status of a transaction
 * This is a specialized endpoint for quick status updates
 */
async function handleUpdateStatus(request, context) {
  try {
    // Check permissions
    if (!permissions.canUpdateTransaction(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    // In Next.js 16+, params is a Promise that needs to be awaited
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return errorResponse("Transaction ID is required", 400);
    }

    const { payment_status } = body;

    // Validate payment_status
    const validStatuses = ["UNPAID", "DOWN_PAYMENT", "PAID"];
    if (!payment_status || !validStatuses.includes(payment_status)) {
      return errorResponse(
        `Invalid payment status. Must be one of: ${validStatuses.join(", ")}`,
        400
      );
    }

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return errorResponse("Transaction not found", 404);
    }

    // Update only the payment status
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        payment_status,
        updatedAt: new Date(),
      },
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });

    return successResponse(
      updatedTransaction,
      `Payment status updated to ${payment_status}`
    );
  } catch (error) {
    console.error("Error updating payment status:", error);
    return errorResponse("Failed to update payment status", 500);
  }
}

/**
 * PUT /api/transactions/status/[id]
 * Alias for PATCH - both methods work the same
 * Only ADMIN can update payment status
 */
export const PUT = protectedRoute(handleUpdateStatus, ["ADMIN"]);
export const PATCH = protectedRoute(handleUpdateStatus, ["ADMIN"]);
