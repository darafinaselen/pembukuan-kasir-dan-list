import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { protectedRoute } from "@/lib/middleware";
import { logTransactionEvent } from "@/lib/audit";

/**
 * POST /api/transactions/[id]/reject-edit
 * Admin reject edit request
 */
async function handleRejectEdit(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { rejection_reason } = body;
    const user = req.auth.user;

    if (!rejection_reason || !rejection_reason.trim()) {
      return NextResponse.json(
        { error: "Alasan penolakan harus diisi" },
        { status: 400 }
      );
    }

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

    // Restore original data and clear edit request
    const restoredData = transaction.original_data || {};
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...restoredData,
        approval_status: "REJECTED",
        rejection_reason: rejection_reason,
        rejected_at: new Date(),
        rejected_by: user.id,
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
    await logTransactionEvent(user, "REJECT_EDIT", updatedTransaction, req);

    return NextResponse.json({
      success: true,
      message: "Permintaan edit berhasil ditolak",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("Reject edit transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menolak edit" },
      { status: 500 }
    );
  }
}

export const POST = protectedRoute(handleRejectEdit, {
  roles: ["ADMIN"],
  permissions: ["canRejectTransactionEdit"],
});