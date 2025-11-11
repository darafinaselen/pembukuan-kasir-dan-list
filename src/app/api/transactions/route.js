import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logTransactionEvent } from "@/lib/audit";
import { validateTransactionData } from "@/lib/validators/transaction-validator";

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

    // Validate input data
    const validation = validateTransactionData(body, false);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return errorResponse({ message: "Validasi gagal", errors }, 400);
    }

    const validatedData = validation.data;

    // Generate collision-resistant invoice code
    const { nanoid } = await import("nanoid");
    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
    const uniqueSuffix = nanoid(6).toUpperCase();
    const invoice_code = `RLM-${yyyymmdd}-${uniqueSuffix}`;

    // Determine status based on checkout date
    const isStartingTodayOrPast =
      new Date(validatedData.checkout_datetime) <= new Date();
    const armadaStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";
    const driverStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";

    // Use atomic transaction with availability verification to prevent race condition
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock and verify armada availability
      const armada = await tx.armada.findFirst({
        where: {
          id: validatedData.armadaId,
          status: "READY",
        },
      });

      if (!armada) {
        throw new Error("Armada tidak tersedia atau tidak ditemukan.");
      }

      // 2. Lock and verify driver availability
      const driver = await tx.driver.findFirst({
        where: {
          id: validatedData.driverId,
          status: "READY",
        },
      });

      if (!driver) {
        throw new Error("Sopir tidak tersedia atau tidak ditemukan.");
      }

      // 3. Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
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
          payment_status: validatedData.payment_status || "UNPAID",

          // Optional tour package data
          hotel_name: validatedData.hotel_name,
          pax_count: validatedData.pax_count,

          // Generated
          invoice_code: invoice_code,

          // Relations
          armadaId: validatedData.armadaId,
          driverId: validatedData.driverId,
          packageId: validatedData.packageId || null,
        },
      });

      // 4. Update armada status
      await tx.armada.update({
        where: { id: validatedData.armadaId },
        data: { status: armadaStatus },
      });

      // 5. Update driver status
      await tx.driver.update({
        where: { id: validatedData.driverId },
        data: { status: driverStatus },
      });

      return newTransaction;
    });

    // Log audit event
    await logTransactionEvent(
      request.auth.user.id,
      "CREATE",
      result.id,
      result,
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse(result, 201);
  } catch (error) {
    console.error("Error creating transaction:", error);

    // Handle availability conflicts
    if (error.message && error.message.includes("tidak tersedia")) {
      return errorResponse(error.message, 409);
    }

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
