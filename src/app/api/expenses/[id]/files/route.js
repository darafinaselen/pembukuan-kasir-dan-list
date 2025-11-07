import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile, getFile } from "@/lib/minio";
import { NextResponse } from "next/server";

// Helper function to generate file name
function generateFileName(expenseId, category, date, originalFileName) {
  const dateStr = new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD
  const ext = originalFileName.split(".").pop();
  const sanitizedCategory = category.replace(/[^a-zA-Z0-9]/g, "_");
  const timestamp = Date.now();
  return `expenses/${expenseId}/${dateStr}_${sanitizedCategory}_${timestamp}.${ext}`;
}

/**
 * GET /api/expenses/[id]/files
 * Get all files for an expense
 */
async function handleGetFiles(request, { params }) {
  const { id: expenseId } = await params;

  try {
    if (!permissions.canViewExpenses(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const attachments = await prisma.expenseAttachment.findMany({
      where: { expenseId },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(attachments);
  } catch (error) {
    console.error("Error fetching files:", error);
    return errorResponse("Gagal mengambil daftar file", 500);
  }
}

/**
 * POST /api/expenses/[id]/files
 * Upload file for an expense
 */
async function handleUploadFile(request, { params }) {
  const { id: expenseId } = await params;

  try {
    if (!permissions.canUpdateExpense(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    // Get expense data
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return errorResponse("Pengeluaran tidak ditemukan", 404);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return errorResponse("File tidak ditemukan", 400);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return errorResponse("Ukuran file maksimal 10MB", 400);
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate file name
    const fileName = generateFileName(
      expenseId,
      expense.category,
      expense.date,
      file.name
    );

    // Upload to MinIO
    await uploadFile(buffer, fileName, file.type);

    // Save to database
    const attachment = await prisma.expenseAttachment.create({
      data: {
        expenseId,
        fileName: file.name,
        filePath: fileName,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return successResponse(attachment, 201);
  } catch (error) {
    console.error("Error uploading file:", error);
    return errorResponse("Gagal mengupload file", 500);
  }
}

export const GET = protectedRoute(handleGetFiles, {
  roles: ["ADMIN", "MANAGER"],
});

export const POST = protectedRoute(handleUploadFile, {
  roles: ["ADMIN", "MANAGER"],
});
