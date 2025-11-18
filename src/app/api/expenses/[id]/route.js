import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logExpenseEvent } from "@/lib/audit";
import { initStorage, uploadFile, deleteFile } from "@/lib/file-storage";
import { v4 as uuidv4 } from "uuid";

async function handleUpdateExpense(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    // Check permissions
    if (!permissions.canUpdateExpense(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    // Check if expense exists and get approval status
    const existingExpense = await prisma.expense.findUnique({
      where: { id: idFromParams },
    });

    if (!existingExpense) {
      return errorResponse("Expense not found", 404);
    }

    const userRole = request.auth.user.role;
    const approvalStatus = existingExpense.approval_status;

    if (userRole === "OPERATOR") {
      // OPERATOR can only edit DRAFT expenses
      if (approvalStatus !== "DRAFT" && approvalStatus !== null) {
        return errorResponse("Pengeluaran tidak dapat diedit karena sudah disetujui", 403);
      }
    }

    // ADMIN can edit any expense - no restrictions
    // (Approval workflow restrictions removed for ADMIN role)

    const formData = await request.formData();

    // Extract fields from FormData
    const body = {};
    for (const [key, value] of formData.entries()) {
      if (key === "file") {
        // Handle file separately if needed
        body.file = value;
      } else {
        body[key] = value;
      }
    }

    // Parse date and paymentMonth if present
    if (body.date) {
      body.date = new Date(body.date);
    }
    if (body.paymentMonth) {
      body.paymentMonth = new Date(body.paymentMonth);
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
    }

    // Build the update data object with proper Prisma relations
    const updateData = {
      date: body.date,
      paymentMonth: body.paymentMonth || null,
      category: finalCategory,
      description: body.description,
      amount: amount,
      namaPenerima: body.namaPenerima || null,
    };

    // Handle optional relations - disconnect if null, connect if provided
    if (body.armadaId === null) {
      updateData.armada = { disconnect: true };
    } else if (body.armadaId) {
      updateData.armada = { connect: { id: body.armadaId } };
    }

    if (body.driverId === null) {
      updateData.driver = { disconnect: true };
    } else if (body.driverId) {
      updateData.driver = { connect: { id: body.driverId } };
    }

    if (body.staffId === null) {
      updateData.staff = { disconnect: true };
    } else if (body.staffId) {
      updateData.staff = { connect: { id: body.staffId } };
    }

    const updatedData = await prisma.expense.update({
      where: { id: idFromParams },
      data: updateData,
      include: {
        armada: true,
        driver: true,
        staff: true,
        attachments: true,
      },
    });

    // Handle file upload if present
    if (body.file && body.file instanceof File) {
      try {
        await initStorage();

        // If replacing existing file, delete old one first
        if (body.replaceExisting === "true" && body.oldFileId) {
          const oldAttachment = await prisma.expenseAttachment.findUnique({
            where: { id: body.oldFileId },
          });

          if (oldAttachment) {
            // Delete file from storage
            try {
              await deleteFile(oldAttachment.filePath);
            } catch (delError) {
              console.error("Error deleting old file from storage:", delError);
            }

            // Delete from database
            await prisma.expenseAttachment.delete({
              where: { id: body.oldFileId },
            });
          }
        }

        const fileBuffer = Buffer.from(await body.file.arrayBuffer());
        const fileExt = body.file.name.split(".").pop();
        const fileName = `expense-${updatedData.id}-${uuidv4()}.${fileExt}`;

        const filePath = await uploadFile(fileName, fileBuffer, body.file.type);

        // Create new attachment record
        await prisma.expenseAttachment.create({
          data: {
            expenseId: updatedData.id,
            fileName: body.file.name,
            filePath: filePath,
            fileSize: body.file.size,
            mimeType: body.file.type,
          },
        });
      } catch (fileError) {
        console.error("Error uploading file:", fileError);
        // Don't fail the whole request if file upload fails
      }
    }

    // Fetch updated data with attachments
    const finalData = await prisma.expense.findUnique({
      where: { id: idFromParams },
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
      "UPDATE",
      finalData.id,
      finalData,
      request.auth.ipAddress,
      request.auth.userAgent
    );

    return successResponse(finalData);
  } catch (error) {
    console.error(`Error updating pengeluaran ${idFromParams}:`, error);
    console.error("Error stack:", error.stack);
    return errorResponse(
      error.message || "Gagal mengupdate data",
      error.statusCode || 500
    );
  }
}

async function handleDeleteExpense(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    // Check permissions
    if (!permissions.canDeleteExpense(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: idFromParams },
    });

    if (!existingExpense) {
      return errorResponse("Expense not found", 404);
    }

    // Prevent deletion if status has pending requests (but allow ADMIN to delete APPROVED)
    const userRole = request.auth.user.role;

    if (userRole !== "ADMIN") {
      if (existingExpense.approval_status === "APPROVED") {
        return errorResponse("Pengeluaran yang sudah disetujui tidak dapat dihapus", 403);
      }
    }

    if (existingExpense.approval_status === "PENDING_EDIT" || existingExpense.approval_status === "PENDING_DELETE") {
      return errorResponse("Pengeluaran dengan request pending tidak dapat dihapus", 403);
    }

    // Log audit event before deletion
    await logExpenseEvent(
      request.auth.user.id,
      "DELETE",
      idFromParams,
      existingExpense,
      request.auth.ipAddress,
      request.auth.userAgent
    );

    await prisma.expense.delete({
      where: { id: idFromParams },
    });

    return successResponse({ message: "Data berhasil dihapus" });
  } catch (error) {
    console.error(`Error deleting pengeluaran ${idFromParams}:`, error);
    return errorResponse("Gagal menghapus data", 500);
  }
}

// ADMIN and OPERATOR can update expenses (status-based checks inside handler)
export const PUT = protectedRoute(handleUpdateExpense, {
  roles: ["ADMIN", "OPERATOR"],
});

export const DELETE = protectedRoute(handleDeleteExpense, {
  roles: ["ADMIN"],
});
