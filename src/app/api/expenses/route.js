import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logExpenseEvent } from "@/lib/audit";

async function handleGetExpenses(request) {
  try {
    // Check permissions
    if (!permissions.canViewExpenses(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const data = await prisma.expense.findMany({
      orderBy: {
        date: "desc",
      },
      include: {
        armada: true,
        driver: true,
        staff: true,
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
        },
      },
    });
    return successResponse(data);
  } catch (error) {
    console.error("Error fetching pengeluaran:", error);
    return errorResponse("Gagal mengambil data", 500);
  }
}

async function handleCreateExpense(request) {
  try {
    // Check permissions
    if (!permissions.canCreateExpense(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const body = await request.json();

    if (!body.date || !body.category || !body.description || !body.amount) {
      return errorResponse("Data tidak lengkap", 400);
    }

    // Validate amount is a number
    const amount =
      typeof body.amount === "number" ? body.amount : parseInt(body.amount, 10);
    if (isNaN(amount) || amount <= 0) {
      return errorResponse(
        "Jumlah harus berupa angka yang valid dan lebih dari 0",
        400
      );
    }

    let finalCategory = body.category;
    if (body.category === "LAINNYA" && body.kategoriLainnya) {
      finalCategory = body.kategoriLainnya;
    } else if (body.category === "LAINNYA" && !body.kategoriLainnya) {
      return errorResponse("Kategori 'Lainnya' tidak boleh kosong", 400);
    }

    // Build the data object with proper Prisma relations
    const createData = {
      date: body.date,
      paymentMonth: body.paymentMonth || null,
      category: finalCategory,
      description: body.description,
      amount: amount,
    };

    // Add optional relations using connect
    if (body.armadaId) {
      createData.armada = { connect: { id: body.armadaId } };
    }
    if (body.driverId) {
      createData.driver = { connect: { id: body.driverId } };
    }
    if (body.staffId) {
      createData.staff = { connect: { id: body.staffId } };
    }

    const newData = await prisma.expense.create({
      data: createData,
      include: {
        armada: true,
        driver: true,
        staff: true,
        attachments: true,
      },
    });

    // Log audit event
    await logExpenseEvent(
      request.auth.user.id,
      "CREATE",
      newData.id,
      newData,
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse(newData, 201);
  } catch (error) {
    console.error("Error creating pengeluaran:", error);
    return errorResponse("Gagal membuat data", 500);
  }
}

// Only ADMIN and MANAGER can view and create expenses
export const GET = protectedRoute(handleGetExpenses, {
  roles: ["ADMIN", "MANAGER"],
});

export const POST = protectedRoute(handleCreateExpense, {
  roles: ["ADMIN", "MANAGER"],
});
