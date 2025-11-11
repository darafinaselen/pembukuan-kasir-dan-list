import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { validateTransactionData } from "@/lib/validators/transaction-validator";

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
        package: true,
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

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return errorResponse("Transaction not found", 404);
    }

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

      // Relations
      armadaId: validatedData.armadaId,
      driverId: validatedData.driverId,
      packageId: validatedData.packageId,
    };

    // Determine new status for armada and driver based on checkout date
    const isStartingTodayOrPast =
      new Date(validatedData.checkout_datetime) <= new Date();
    const newArmadaStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";
    const newDriverStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";

    // Use atomic transaction with availability verification to prevent race condition
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // If armada changed, verify new armada availability
      if (
        existingTransaction.armadaId !== validatedData.armadaId &&
        validatedData.armadaId
      ) {
        const armada = await tx.armada.findFirst({
          where: {
            id: validatedData.armadaId,
            status: "READY",
          },
        });

        if (!armada) {
          throw new Error("Armada baru tidak tersedia atau tidak ditemukan.");
        }
      }

      // If driver changed, verify new driver availability
      if (
        existingTransaction.driverId !== validatedData.driverId &&
        validatedData.driverId
      ) {
        const driver = await tx.driver.findFirst({
          where: {
            id: validatedData.driverId,
            status: "READY",
          },
        });

        if (!driver) {
          throw new Error("Sopir baru tidak tersedia atau tidak ditemukan.");
        }
      }

      // Update transaction
      const updated = await tx.transaction.update({
        where: { id },
        data: updateData,
        include: {
          package: true,
          armada: true,
          driver: true,
        },
      });

      // If armada changed, reset old armada status and set new armada status
      if (existingTransaction.armadaId !== validatedData.armadaId) {
        if (existingTransaction.armadaId) {
          await tx.armada.update({
            where: { id: existingTransaction.armadaId },
            data: { status: "READY" },
          });
        }
        if (validatedData.armadaId) {
          await tx.armada.update({
            where: { id: validatedData.armadaId },
            data: { status: newArmadaStatus },
          });
        }
      }

      // If driver changed, reset old driver status and set new driver status
      if (existingTransaction.driverId !== validatedData.driverId) {
        if (existingTransaction.driverId) {
          await tx.driver.update({
            where: { id: existingTransaction.driverId },
            data: { status: "READY" },
          });
        }
        if (validatedData.driverId) {
          await tx.driver.update({
            where: { id: validatedData.driverId },
            data: { status: newDriverStatus },
          });
        }
      }

      return updated;
    });

    return successResponse(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);

    // Handle availability conflicts
    if (error.message && error.message.includes("tidak tersedia")) {
      return errorResponse(error.message, 409);
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

    return successResponse({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return errorResponse("Failed to delete transaction", 500);
  }
}

export const GET = protectedRoute(handleGetTransaction);
export const PUT = protectedRoute(handleUpdateTransaction);
export const PATCH = protectedRoute(handleUpdateTransaction);
export const DELETE = protectedRoute(handleDeleteTransaction);
