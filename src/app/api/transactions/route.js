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

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.transaction.count();

    const transactions = await prisma.transaction.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        booking_date: "desc",
      },
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return successResponse({
      data: transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
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

    if (!body.armadaId || !body.driverId) {
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
          payment_status: body.payment_status || "UNPAID",

          // Optional tour package data
          hotel_name: body.hotel_name,
          pax_count: body.pax_count,

          // Generated
          invoice_code: invoice_code,

          // Relations
          armadaId: body.armadaId,
          driverId: body.driverId,
          packageId: body.packageId || null,
        },
      }),

      prisma.armada.update({
        where: { id: body.armadaId },
        data: { status: armadaStatus },
      }),

      prisma.driver.update({
        where: { id: body.driverId },
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
