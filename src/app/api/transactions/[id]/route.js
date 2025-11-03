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

    const { id } = params;

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
    if (!permissions.canEditTransaction(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return errorResponse("Transaction ID is required", 400);
    }

    const { armadaId, driverId, packageId, ...transactionData } = body;

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return errorResponse("Transaction not found", 404);
    }

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...transactionData,
        armada: armadaId ? { connect: { id: armadaId } } : undefined,
        driver: driverId ? { connect: { id: driverId } } : undefined,
        package: packageId ? { connect: { id: packageId } } : undefined,
      },
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

    const { id } = params;

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
