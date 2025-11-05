import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

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
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,

      // Dates
      booking_date: body.booking_date,
      checkout_datetime: body.checkout_datetime,
      checkin_datetime: body.checkin_datetime,

      // Financial data
      all_in_rate: body.all_in_rate,
      overtime_rate_per_hour: body.overtime_rate_per_hour,
      dp_amount: body.dp_amount,
      payment_status: body.payment_status,

      // Optional tour package data
      hotel_name: body.hotel_name,
      pax_count: body.pax_count,

      // Relations
      armadaId: body.armadaId,
      driverId: body.driverId,
      packageId: body.packageId,
    };

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });

    return successResponse(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
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

    // Delete transaction
    await prisma.transaction.delete({
      where: { id },
    });

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
