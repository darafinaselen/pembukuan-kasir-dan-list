import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { protectedRoute } from "@/lib/middleware";
import { logTransactionEvent } from "@/lib/audit";

/**
 * POST /api/transactions/[id]/approve-edit
 * Admin approve edit request
 */
async function handleApproveEdit(req, { params }) {
  try {
    const { id } = await params;
    const user = req.auth.user;

    // Get transaction with edit request
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    if (transaction.approval_status !== "PENDING_EDIT") {
      return NextResponse.json(
        { error: "Transaksi tidak memiliki permintaan edit yang pending" },
        { status: 400 }
      );
    }

    if (!transaction.proposed_changes) {
      return NextResponse.json(
        { error: "Data perubahan tidak ditemukan" },
        { status: 400 }
      );
    }

    // Apply the proposed changes
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...transaction.proposed_changes,
        approval_status: "APPROVED",
        approved_at: new Date(),
        approved_by: user.id,
        // Clear edit request data
        edit_request_reason: null,
        proposed_changes: null,
        original_data: null,
        requested_by_id: null,
        requested_at: null,
      },
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });

    // Log audit event
    await logTransactionEvent(user, "APPROVE_EDIT", updatedTransaction, req);

    return NextResponse.json({
      success: true,
      message: "Permintaan edit berhasil disetujui",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("Approve edit transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyetujui edit" },
      { status: 500 }
    );
  }
}

export const POST = protectedRoute(handleApproveEdit, {
  roles: ["ADMIN"],
  permissions: ["canApproveTransactionEdit"],
});