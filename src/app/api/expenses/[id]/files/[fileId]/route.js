import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { getFileStream, deleteFile, STORAGE_MODE } from "@/lib/file-storage";
import { NextResponse } from "next/server";

/**
 * GET /api/expenses/[expenseId]/files/[fileId]?download=true
 * Download or preview a specific file
 */
async function handleDownloadFile(request, { params }) {
  const { id: expenseId, fileId } = await params;
  const { searchParams } = new URL(request.url);
  const isDownload = searchParams.get("download") === "true";

  console.log(`📡 API Request: /api/expenses/${expenseId}/files/${fileId}`);
  console.log(`📡 isDownload: ${isDownload}`);
  console.log(`📡 User:`, request.auth?.user?.id);

  try {
    if (!permissions.canViewExpenses(request.auth.user)) {
      console.log("❌ Permission denied");
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
      console.log("❌ File not found in database");
      return errorResponse("File tidak ditemukan", 404);
    }

    console.log(
      "✅ File found:",
      attachment.fileName,
      "Type:",
      attachment.mimeType,
      "Size:",
      attachment.fileSize
    );

    // Get file from storage
    const fileData = await getFileStream(attachment.filePath);
    console.log("✅ File stream obtained, type:", typeof fileData);
    console.log("🗄️ Current STORAGE_MODE:", STORAGE_MODE);

    // Handle different storage modes
    let responseData;
    if (STORAGE_MODE === "minio") {
      console.log("🔄 Converting MinIO stream to buffer...");
      // For MinIO, we need to collect the stream data
      const chunks = [];
      for await (const chunk of fileData) {
        chunks.push(chunk);
      }
      responseData = Buffer.concat(chunks);
      console.log(
        "📦 MinIO stream converted to buffer, size:",
        responseData.length
      );
    } else {
      // For local storage, fileData is already a buffer
      responseData = fileData;
      console.log("📁 Using local file buffer, size:", responseData.length);
    }

    // Return file as response
    const headers = {
      "Content-Type": attachment.mimeType,
      "Content-Length": responseData.length.toString(),
      "Cache-Control": "no-cache",
    };

    // Add Content-Disposition only for downloads
    if (isDownload) {
      headers["Content-Disposition"] =
        `attachment; filename="${attachment.fileName}"`;
      console.log("📥 Download mode - Content-Disposition added");
    } else {
      console.log("👁️ Preview mode - no Content-Disposition");
    }

    console.log("📤 Response headers:", headers);
    console.log("📤 Sending buffer with length:", responseData.length);

    return new NextResponse(responseData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("❌ Error downloading file:", error);
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

    // Delete from storage
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
  roles: ["ADMIN", "OPERATOR"],
});

export const DELETE = protectedRoute(handleDeleteFile, {
  roles: ["ADMIN", "OPERATOR"],
});
