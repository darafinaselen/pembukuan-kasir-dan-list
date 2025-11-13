import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { validateTransactionData } from "@/lib/validators/transaction-validator";
import { logTransactionEvent } from "@/lib/audit";

async function handleGetTransaction(request, { params }) {
  try {
    // Check permissions
    if (!permissions.canViewTransactions(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    // In Next.js 15+, params is a Promise that needs to be awaited
    const { id } = await params;

    if (!id) {
      return errorResponse("Transaction ID is required", 400);
    }

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: id,
      },
      include: {
        package: {
          include: {
            hotelTiers: {
              include: {
                hotels: true,
                priceRanges: true,
              },
            },
          },
        },
        armada: true,
        driver: true,
      },
    });

    if (!transaction) {
      return errorResponse("Transaction not found", 404);
    }

    return successResponse(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return errorResponse("Failed to fetch transaction", 500);
  }
}

async function handleUpdateTransaction(request, { params }) {
  try {
    // Check permissions
    if (!permissions.canUpdateTransaction(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    // In Next.js 15+, params is a Promise that needs to be awaited
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return errorResponse("Transaction ID is required", 400);
    }

    // Check if transaction exists and get approval status
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return errorResponse("Transaction not found", 404);
    }

    // Prevent editing completed transactions
    if (existingTransaction.actual_checkin_datetime) {
      return errorResponse(
        "Transaksi yang sudah selesai tidak dapat diedit",
        403
      );
    }

    const userRole = request.auth.user.role;
    const approvalStatus = existingTransaction.approval_status;

    // OPERATOR can only edit DRAFT transactions
    if (userRole === "OPERATOR" && approvalStatus !== "DRAFT") {
      return errorResponse(
        "Operator hanya dapat mengedit transaksi dengan status DRAFT",
        403
      );
    }

    // ADMIN cannot edit PENDING or APPROVED transactions
    if (userRole === "ADMIN") {
      if (approvalStatus === "PENDING") {
        return errorResponse(
          "Transaksi tidak dapat diedit karena sedang menunggu persetujuan",
          403
        );
      }

      if (approvalStatus === "APPROVED") {
        return errorResponse(
          "Transaksi yang sudah disetujui tidak dapat diedit",
          403
        );
      }
    }

    // Validate input data
    const validation = validateTransactionData(body, true);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return errorResponse({ message: "Validasi gagal", errors }, 400);
    }

    const validatedData = validation.data;

    // Build update data object explicitly
    const updateData = {
      // Customer data
      customer_name: validatedData.customer_name,
      customer_phone: validatedData.customer_phone,

      // Dates
      booking_date: validatedData.booking_date,
      checkout_datetime: validatedData.checkout_datetime,
      checkin_datetime: validatedData.checkin_datetime,

      // Financial data
      all_in_rate: validatedData.all_in_rate,
      overtime_rate_per_hour: validatedData.overtime_rate_per_hour,
      dp_amount: validatedData.dp_amount,
      payment_status: validatedData.payment_status,

      // Optional tour package data
      hotel_name: validatedData.hotel_name,
      pax_count: validatedData.pax_count,
      hotel_tier_id: validatedData.hotel_tier_id,

      // Relations
      armadaId: validatedData.armadaId,
      driverId: validatedData.driverId,
      packageId: validatedData.packageId,
    };

    // Use atomic transaction to update transaction data
    // NOTE: Resources are NOT locked here because transaction is in DRAFT or REJECTED status.
    // Resources will be locked only when transaction is APPROVED (see approve endpoint).
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // Verify armada and driver exist (but don't check status - resources aren't locked yet)
      if (validatedData.armadaId) {
        const armada = await tx.armada.findUnique({
          where: {
            id: validatedData.armadaId,
          },
        });

        if (!armada) {
          throw new Error("Armada tidak ditemukan.");
        }
      }

      if (validatedData.driverId) {
        const driver = await tx.driver.findUnique({
          where: {
            id: validatedData.driverId,
          },
        });

        if (!driver) {
          throw new Error("Sopir tidak ditemukan.");
        }
      }

      // Update transaction (resources remain in their current status)
      const updated = await tx.transaction.update({
        where: { id },
        data: updateData,
        include: {
          package: {
            include: {
              hotelTiers: {
                include: {
                  hotels: true,
                  priceRanges: true,
                },
              },
            },
          },
          armada: true,
          driver: true,
        },
      });

      return updated;
    });

    // Log audit event
    await logTransactionEvent(
      request.auth.user,
      "UPDATE",
      updatedTransaction,
      request
    );

    return successResponse(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);

    // Handle validation errors
    if (error.message && error.message.includes("tidak ditemukan")) {
      return errorResponse(error.message, 404);
    }

    return errorResponse("Failed to update transaction", 500);
  }
}

async function handleDeleteTransaction(request, { params }) {
  try {
    // Check permissions
    if (!permissions.canDeleteTransaction(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    // In Next.js 15+, params is a Promise that needs to be awaited
    const { id } = await params;

    if (!id) {
      return errorResponse("Transaction ID is required", 400);
    }

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return errorResponse("Transaction not found", 404);
    }

    // Prevent deletion if status is PENDING or APPROVED
    if (existingTransaction.approval_status === "PENDING") {
      return errorResponse(
        "Transaksi tidak dapat dihapus karena sedang menunggu persetujuan",
        403
      );
    }

    if (existingTransaction.approval_status === "APPROVED") {
      return errorResponse(
        "Transaksi yang sudah disetujui tidak dapat dihapus",
        403
      );
    }

    // Delete transaction and reset armada/driver status in a transaction
    await prisma.$transaction([
      // Delete the transaction
      prisma.transaction.delete({
        where: { id },
      }),

      // Reset armada status to READY if it was associated
      ...(existingTransaction.armadaId
        ? [
            prisma.armada.update({
              where: { id: existingTransaction.armadaId },
              data: { status: "READY" },
            }),
          ]
        : []),

      // Reset driver status to READY if it was associated
      ...(existingTransaction.driverId
        ? [
            prisma.driver.update({
              where: { id: existingTransaction.driverId },
              data: { status: "READY" },
            }),
          ]
        : []),
    ]);

    // Log audit event
    await logTransactionEvent(
      request.auth.user,
      "DELETE",
      existingTransaction,
      request
    );

    return successResponse({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return errorResponse("Failed to delete transaction", 500);
  }
}

export const GET = protectedRoute(handleGetTransaction);
export const PUT = protectedRoute(handleUpdateTransaction, ["ADMIN"]);
export const PATCH = protectedRoute(handleUpdateTransaction, ["ADMIN"]);
export const DELETE = protectedRoute(handleDeleteTransaction);
