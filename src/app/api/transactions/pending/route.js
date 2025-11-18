import { prisma } from "@/lib/prisma";
import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";

/**
 * GET /api/transactions/pending
 * Get all pending transactions for approval (ADMIN only)
 */
async function handleGetPendingTransactions(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Get pending transactions with details (including edit requests)
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          OR: [
            { approval_status: "PENDING" },
            { approval_status: "PENDING_EDIT" },
          ],
        },
        include: {
          armada: true,
          driver: true,
          package: true,
          requested_by: { select: { name: true, email: true } },
        },
        orderBy: {
          submitted_at: "asc", // Oldest submissions first
        },
        skip,
        take: limit,
      }),
      prisma.transaction.count({
        where: {
          OR: [
            { approval_status: "PENDING" },
            { approval_status: "PENDING_EDIT" },
          ],
        },
      }),
    ]);

    return successResponse({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get pending transactions error:", error);
    return errorResponse(
      error.message || "Gagal mengambil transaksi pending",
      500
    );
  }
}

export const GET = protectedRoute(handleGetPendingTransactions, ["ADMIN"]);
