import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logTransactionEvent } from "@/lib/audit";

async function handleCompleteTransaction(request, { params }) {
  try {
    // Check permissions
    if (!permissions.canUpdateTransaction(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const { id } = await params;
    const body = await request.json();

    console.log("Complete transaction request - ID:", id);
    console.log("Request body:", body);

    if (!id) {
      return errorResponse("Transaction ID is required", 400);
    }

    const { actual_checkin_datetime, actual_overtime_cost } = body;

    if (!actual_checkin_datetime) {
      const errMsg = "Waktu mobil kembali aktual harus diisi";
      console.error(errMsg);
      return errorResponse(errMsg, 400);
    }

    // Validate date format
    const checkinDate = new Date(actual_checkin_datetime);
    if (isNaN(checkinDate.getTime())) {
      const errMsg = `Format waktu mobil kembali tidak valid: ${actual_checkin_datetime}`;
      console.error(errMsg);
      return errorResponse(errMsg, 400);
    }

    console.log("Checkin date parsed successfully:", checkinDate);

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        armada: true,
        driver: true,
        package: true,
      },
    });

    console.log("Existing transaction found:", existingTransaction?.id);

    if (!existingTransaction) {
      const errMsg = "Transaction not found";
      console.error(errMsg);
      return errorResponse(errMsg, 404);
    }

    // Check if transaction is already completed
    if (existingTransaction.actual_checkin_datetime) {
      const errMsg = "Transaksi sudah diselesaikan sebelumnya";
      console.error(errMsg);
      return errorResponse(errMsg, 400);
    }

    // Validate that armada and driver exist
    if (!existingTransaction.armadaId || !existingTransaction.driverId) {
      const errMsg = `Transaction tidak memiliki armada atau driver yang valid. ArmadaId: ${existingTransaction.armadaId}, DriverId: ${existingTransaction.driverId}`;
      console.error(errMsg);
      return errorResponse(errMsg, 400);
    }

    // Update transaction with completion data and reset armada/driver status
    const [updatedTransaction] = await prisma.$transaction([
      // Update transaction
      prisma.transaction.update({
        where: { id },
        data: {
          actual_checkin_datetime: new Date(actual_checkin_datetime),
          actual_overtime_cost: actual_overtime_cost || 0,
        },
        include: {
          package: true,
          armada: true,
          driver: true,
        },
      }),

      // Reset armada status to READY
      prisma.armada.update({
        where: { id: existingTransaction.armadaId },
        data: { status: "READY" },
      }),

      // Reset driver status to READY
      prisma.driver.update({
        where: { id: existingTransaction.driverId },
        data: { status: "READY" },
      }),
    ]);

    // Log audit event
    await logTransactionEvent(
      request.auth.user.id,
      "COMPLETE",
      updatedTransaction.id,
      {
        ...updatedTransaction,
        actual_checkin_datetime: updatedTransaction.actual_checkin_datetime,
        actual_overtime_cost: updatedTransaction.actual_overtime_cost,
      },
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse(updatedTransaction, 200);
  } catch (error) {
    console.error("Error completing transaction:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    // Return detailed error message
    const errorMessage = error.message || "Failed to complete transaction";
    return errorResponse(
      `Failed to complete transaction: ${errorMessage}`,
      500
    );
  }
}

export const PUT = protectedRoute(handleCompleteTransaction);
