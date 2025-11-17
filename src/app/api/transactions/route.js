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

    // Determine if admin created this transaction for auto-approval
    const isAdmin = request.auth.user?.role === "ADMIN";
    const approvalMeta = isAdmin
      ? {
          approval_status: "APPROVED",
          approved_at: new Date(),
          approved_by: request.auth.user.id,
        }
      : {};

    // Generate collision-resistant invoice code (alphanumeric only, uppercase)
    const { nanoid } = await import("nanoid");
    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
    // Use only uppercase alphanumeric characters (no symbols)
    const uniqueSuffix = nanoid(6).toUpperCase();
    const invoice_code = `RLM-${yyyymmdd}-${uniqueSuffix}`;

    // Use atomic transaction with availability verification to prevent race condition
    // NOTE: Resources are NOT locked here because transaction is in DRAFT status.
    // Resources will be locked only when transaction is APPROVED (see approve endpoint).
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify armada exists (but don't check status - it can be READY, BOOKED, or ON_TRIP)
      const armada = await tx.armada.findUnique({
        where: {
          id: validatedData.armadaId,
        },
      });

      if (!armada) {
        throw new Error("Armada tidak ditemukan.");
      }

      // 2. Verify driver exists (but don't check status - it can be READY, BOOKED, or ON_TRIP)
      const driver = await tx.driver.findUnique({
        where: {
          id: validatedData.driverId,
        },
      });

      if (!driver) {
        throw new Error("Sopir tidak ditemukan.");
      }

      // 3. Create transaction (status default: DRAFT)
      // Resources remain in their current status and will be locked only upon approval
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
          hotel_tier_id: validatedData.hotel_tier_id,
          custom_price: validatedData.custom_price,

          // Generated
          invoice_code: invoice_code,

          // Relations
          armadaId: validatedData.armadaId,
          driverId: validatedData.driverId,
          packageId: validatedData.packageId || null,
          ...approvalMeta,
        },
      });

      return newTransaction;
    });

    // Log audit event
    await logTransactionEvent(request.auth.user, "CREATE", result, request);

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

// ADMIN and OPERATOR can view and create transactions
// OPERATOR creates as DRAFT and must submit for approval
export const GET = protectedRoute(handleGetTransactions, {
  roles: ["ADMIN", "OPERATOR"],
});

export const POST = protectedRoute(handleCreateTransaction, {
  roles: ["ADMIN", "OPERATOR"],
});
