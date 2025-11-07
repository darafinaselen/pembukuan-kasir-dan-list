import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { getFile, deleteFile } from "@/lib/minio";
import { NextResponse } from "next/server";

/**
 * GET /api/expenses/[expenseId]/files/[fileId]
 * Download a specific file
 */
async function handleDownloadFile(request, { params }) {
  const { id: expenseId, fileId } = await params;

  try {
    if (!permissions.canViewExpenses(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    // Get attachment info
    const attachment = await prisma.expenseAttachment.findFirst({
      where: {
        id: fileId,
        expenseId,
      },
    });

    if (!attachment) {
      return errorResponse("File tidak ditemukan", 404);
    }

    // Get file from MinIO
    const fileBuffer = await getFile(attachment.filePath);

    // Return file as response
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.fileName}"`,
        "Content-Length": attachment.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return errorResponse("Gagal mendownload file", 500);
  }
}

/**
 * DELETE /api/expenses/[expenseId]/files/[fileId]
 * Delete a specific file
 */
async function handleDeleteFile(request, { params }) {
  const { id: expenseId, fileId } = await params;

  try {
    if (!permissions.canDeleteExpense(request.auth.user)) {
      return errorResponse("Insufficient permissions", 403);
    }

    // Get attachment info
    const attachment = await prisma.expenseAttachment.findFirst({
      where: {
        id: fileId,
        expenseId,
      },
    });

    if (!attachment) {
      return errorResponse("File tidak ditemukan", 404);
    }

    // Delete from MinIO
    await deleteFile(attachment.filePath);

    // Delete from database
    await prisma.expenseAttachment.delete({
      where: { id: fileId },
    });

    return successResponse({ message: "File berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return errorResponse("Gagal menghapus file", 500);
  }
}

export const GET = protectedRoute(handleDownloadFile, {
  roles: ["ADMIN", "MANAGER"],
});

export const DELETE = protectedRoute(handleDeleteFile, {
  roles: ["ADMIN", "MANAGER"],
});
