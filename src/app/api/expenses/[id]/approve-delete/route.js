import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { protectedRoute } from "@/lib/middleware";
import { logExpenseApprovalEvent } from "@/lib/audit";

/**
 * POST /api/expenses/[id]/approve-delete
 * Admin approve request delete dari operator - akan DELETE expense
 */
async function handleApproveDelete(req, { params }) {
  try {
    const { id } = params;
    const user = req.user;

    // Get expense dengan status PENDING_DELETE
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        attachments: true,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Pengeluaran tidak ditemukan" },
        { status: 404 }
      );
    }

    if (expense.approval_status !== "PENDING_DELETE") {
      return NextResponse.json(
        { error: "Pengeluaran ini tidak dalam status pending delete" },
        { status: 400 }
      );
    }

    // Delete attachments first (cascade akan handle di DB, tapi bisa delete file di MinIO)
    // TODO: Delete files from MinIO storage

    // Log audit event BEFORE deleting (need expense data)
    await logExpenseApprovalEvent(user, "APPROVE_DELETE", expense, req, {
      delete_request_reason: expense.delete_request_reason,
      requested_by: expense.requested_by_id,
      attachments_count: expense.attachments?.length || 0,
    });

    // Delete expense
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message:
        "Request delete berhasil disetujui dan pengeluaran telah dihapus",
    });
  } catch (error) {
    console.error("Approve delete error:", error);
    return NextResponse.json(
      { error: "Gagal menyetujui request delete", details: error.message },
      { status: 500 }
    );
  }
}

export const POST = protectedRoute(handleApproveDelete, ["ADMIN"]);
