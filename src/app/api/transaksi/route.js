import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logTransactionEvent } from "@/lib/audit";

async function handleGetTransactions(request) {
  try {
    // Check permissions
    if (!permissions.canViewTransactions(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const transactions = await prisma.transaction.findMany({
      orderBy: {
        booking_date: "desc",
      },
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });

    return successResponse(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return errorResponse("Gagal mengambil data transaksi", 500);
  }
}

async function handleCreateTransaction(request) {
  try {
    // Check permissions
    if (!permissions.canCreateTransaction(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const body = await request.json();
    const { armadaId, driverId, packageId, ...transactionData } = body;

    if (!armadaId || !driverId) {
      return errorResponse("Armada dan Sopir wajib diisi", 400);
    }

    const isStartingTodayOrPast =
      new Date(body.checkout_datetime) <= new Date();
    const armadaStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";
    const driverStatus = "ON_TRIP";

    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
    const invoice_code = `RLM-${yyyymmdd}-${date
      .getTime()
      .toString()
      .slice(-5)}`;

    const [newTransaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          ...transactionData,
          invoice_code: invoice_code,
          armadaId: armadaId,
          driverId: driverId,
          packageId: packageId || null,
        },
      }),

      prisma.armada.update({
        where: { id: armadaId },
        data: { status: armadaStatus },
      }),

      prisma.driver.update({
        where: { id: driverId },
        data: { status: driverStatus },
      }),
    ]);

    // Log audit event
    await logTransactionEvent(
      request.auth.user.id,
      "CREATE",
      newTransaction.id,
      newTransaction,
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse(newTransaction, 201);
  } catch (error) {
    console.error("Error creating transaction:", error);
    if (error.code === "P2002") {
      return errorResponse("Gagal membuat invoice code unik. Coba lagi.", 409);
    }
    return errorResponse("Gagal membuat transaksi", 500);
  }
}

// All roles can view and create transactions
export const GET = protectedRoute(handleGetTransactions, {
  roles: ["ADMIN", "MANAGER", "OPERATOR"],
});

export const POST = protectedRoute(handleCreateTransaction, {
  roles: ["ADMIN", "MANAGER", "OPERATOR"],
});
