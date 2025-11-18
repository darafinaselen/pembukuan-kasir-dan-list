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
        hotelTier: true,
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
    const { edit_request_reason } = body;

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

    // For OPERATOR: Create edit request instead of direct update
    if (userRole === "OPERATOR") {
      // Validate that reason is provided
      if (!edit_request_reason || !edit_request_reason.trim()) {
        return errorResponse("Alasan permintaan edit harus diisi", 400);
      }

      // Check if already has pending request
      if (approvalStatus === "PENDING_EDIT") {
        return errorResponse("Transaksi ini sudah memiliki permintaan edit yang pending", 400);
      }

      if (approvalStatus === "PENDING") {
        return errorResponse("Transaksi sedang menunggu persetujuan awal", 403);
      }

      if (approvalStatus === "APPROVED") {
        return errorResponse(
          "Transaksi yang sudah disetujui tidak dapat diedit",
          403
        );
      }

      // Validate input data for the edit request
      const validation = validateTransactionData(body, true);
      if (!validation.success) {
        const errors = validation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return errorResponse({ message: "Validasi gagal", errors }, 400);
      }

      const validatedData = validation.data;

      // Backup original data (exclude relations and approval fields)
      const originalData = {
        customer_name: existingTransaction.customer_name,
        customer_phone: existingTransaction.customer_phone,
        booking_date: existingTransaction.booking_date,
        checkout_datetime: existingTransaction.checkout_datetime,
        checkin_datetime: existingTransaction.checkin_datetime,
        all_in_rate: existingTransaction.all_in_rate,
        overtime_rate_per_hour: existingTransaction.overtime_rate_per_hour,
        dp_amount: existingTransaction.dp_amount,
        payment_status: existingTransaction.payment_status,
        hotel_name: existingTransaction.hotel_name,
        pax_count: existingTransaction.pax_count,
        hotel_tier_id: existingTransaction.hotel_tier_id,
        custom_price: existingTransaction.custom_price,
        armadaId: existingTransaction.armadaId,
        driverId: existingTransaction.driverId,
        packageId: existingTransaction.packageId,
      };

      // Store proposed changes
      const proposedChanges = {
        customer_name: validatedData.customer_name,
        customer_phone: validatedData.customer_phone,
        booking_date: validatedData.booking_date,
        checkout_datetime: validatedData.checkout_datetime,
        checkin_datetime: validatedData.checkin_datetime,
        all_in_rate: validatedData.all_in_rate,
        overtime_rate_per_hour: validatedData.overtime_rate_per_hour,
        dp_amount: validatedData.dp_amount,
        payment_status: validatedData.payment_status,
        hotel_name: validatedData.hotel_name,
        pax_count: validatedData.pax_count,
        hotel_tier_id: validatedData.hotel_tier_id,
        custom_price: validatedData.custom_price,
        armadaId: validatedData.armadaId,
        driverId: validatedData.driverId,
        packageId: validatedData.packageId,
      };

      // Update transaction with edit request
      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          approval_status: "PENDING_EDIT",
          edit_request_reason: edit_request_reason,
          original_data: originalData,
          requested_by_id: request.auth.user.id,
          requested_at: new Date(),
          // Note: We don't update the actual data yet - it stays as original
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
          hotelTier: true,
          armada: true,
          driver: true,
          requested_by: { select: { name: true, email: true } },
        },
      });

      // Log audit event
      await logTransactionEvent(
        request.auth.user,
        "REQUEST_EDIT",
        { ...updatedTransaction, proposed_changes: proposedChanges },
        request,
        {
          reason: edit_request_reason,
          proposed_changes: proposedChanges,
          original_data: originalData,
        }
      );

      return successResponse({
        ...updatedTransaction,
        proposed_changes: proposedChanges,
        message: "Permintaan edit berhasil diajukan dan menunggu persetujuan admin"
      });
    }

    // For ADMIN: Direct update (no approval restrictions)
    if (userRole === "ADMIN") {
      // ADMIN can edit any transaction - no approval status restrictions

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

      // Use atomic transaction to update transaction data with race condition protection
      const updatedTransaction = await prisma.$transaction(async (tx) => {
        // Verify armada exists and is available (not preventing concurrent updates to same resources)
        if (validatedData.armadaId) {
          const armada = await tx.armada.findUnique({
            where: {
              id: validatedData.armadaId,
            },
          });

          if (!armada) {
            throw new Error("Armada tidak ditemukan.");
          }
          // Note: We don't check status here since resources aren't locked until approval
        }

        // Verify driver exists and is available (not preventing concurrent updates to same resources)
        if (validatedData.driverId) {
          const driver = await tx.driver.findUnique({
            where: {
              id: validatedData.driverId,
            },
          });

          if (!driver) {
            throw new Error("Sopir tidak ditemukan.");
          }
          // Note: We don't check status here since resources aren't locked until approval
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
            hotelTier: true,
            armada: true,
            driver: true,
            submitted_by: { select: { name: true, email: true } },
            approved_by: { select: { name: true, email: true } },
            rejected_by: { select: { name: true, email: true } },
            requested_by: { select: { name: true, email: true } },
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
    }

    return errorResponse("Invalid user role", 403);
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

    // Prevent deletion if status has restrictions (but allow ADMIN to delete APPROVED)
    const userRole = request.auth.user.role;

    if (userRole !== "ADMIN") {
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
export const PUT = protectedRoute(handleUpdateTransaction, ["ADMIN", "OPERATOR"]);
export const PATCH = protectedRoute(handleUpdateTransaction, ["ADMIN", "OPERATOR"]);
export const DELETE = protectedRoute(handleDeleteTransaction);
