import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { protectedRoute } from "@/lib/middleware";
import { logExpenseApprovalEvent } from "@/lib/audit";

/**
 * POST /api/expenses/[id]/reject
 * Admin reject request edit/delete dari operator
 */
async function handleReject(req, { params }) {
try {
  const { id } = await params;
  const body = await req.json();
  const { reason } = body;
  const user = req.auth.user;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Alasan reject harus diisi" },
        { status: 400 }
      );
    }

    // Get expense dengan status PENDING
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Pengeluaran tidak ditemukan" },
        { status: 404 }
      );
    }

    if (
      expense.approval_status !== "PENDING_EDIT" &&
      expense.approval_status !== "PENDING_DELETE"
    ) {
      return NextResponse.json(
        { error: "Pengeluaran ini tidak dalam status pending" },
        { status: 400 }
      );
    }

    // Untuk PENDING_EDIT: restore original data
    let updateData = {
      approval_status: "APPROVED", // Kembalikan ke APPROVED
      rejection_reason: reason,
      approved_by_id: user.id,
      approved_at: new Date(),
    };

    // Jika ada original_data, restore
    if (expense.original_data && expense.approval_status === "PENDING_EDIT") {
      const originalData = expense.original_data;
      updateData = {
        ...updateData,
        date: originalData.date ? new Date(originalData.date) : expense.date,
        paymentMonth: originalData.paymentMonth
          ? new Date(originalData.paymentMonth)
          : expense.paymentMonth,
        category: originalData.category || expense.category,
        description: originalData.description || expense.description,
        amount: originalData.amount || expense.amount,
        armadaId: originalData.armadaId,
        driverId: originalData.driverId,
        staffId: originalData.staffId,
        namaPenerima: originalData.namaPenerima,
      };
    }

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        armada: true,
        driver: true,
        staff: true,
        requested_by: { select: { name: true, email: true } },
        approved_by: { select: { name: true, email: true } },
      },
    });

    // Log audit event
    await logExpenseApprovalEvent(user, "REJECT", updatedExpense, req, {
      reason,
      previous_status: expense.approval_status,
      edit_request_reason: expense.edit_request_reason,
      delete_request_reason: expense.delete_request_reason,
      requested_by: expense.requested_by_id,
      restored_from_original: expense.original_data ? true : false,
    });

    return NextResponse.json({
      success: true,
      message: "Request berhasil ditolak",
      data: updatedExpense,
    });
  } catch (error) {
    console.error("Reject request error:", error);
    return NextResponse.json(
      { error: "Gagal menolak request", details: error.message },
      { status: 500 }
    );
  }
}

export const POST = protectedRoute(handleReject, ["ADMIN"]);
