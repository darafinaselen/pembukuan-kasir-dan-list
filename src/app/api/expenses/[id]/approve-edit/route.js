import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { protectedRoute } from "@/lib/middleware";
import { logExpenseApprovalEvent } from "@/lib/audit";

/**
 * POST /api/expenses/[id]/approve-edit
 * Admin approve request edit dari operator
 */
async function handleApproveEdit(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { updatedData } = body; // Data baru yang akan di-apply
    const user = req.user;

    if (!updatedData) {
      return NextResponse.json(
        { error: "Data yang akan diupdate harus disertakan" },
        { status: 400 }
      );
    }

    // Get expense dengan status PENDING_EDIT
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Pengeluaran tidak ditemukan" },
        { status: 404 }
      );
    }

    if (expense.approval_status !== "PENDING_EDIT") {
      return NextResponse.json(
        { error: "Pengeluaran ini tidak dalam status pending edit" },
        { status: 400 }
      );
    }

    // Apply perubahan dan ubah status ke APPROVED
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        ...updatedData,
        approval_status: "APPROVED",
        approved_by_id: user.id,
        approved_at: new Date(),
        // Keep original_data, edit_request_reason for audit trail
      },
      include: {
        armada: true,
        driver: true,
        staff: true,
        requested_by: { select: { name: true, email: true } },
        approved_by: { select: { name: true, email: true } },
      },
    });

    // Log audit event
    await logExpenseApprovalEvent(user, "APPROVE_EDIT", updatedExpense, req, {
      updatedData,
      original_data: expense.original_data,
      edit_request_reason: expense.edit_request_reason,
      requested_by: expense.requested_by_id,
    });

    return NextResponse.json({
      success: true,
      message: "Request edit berhasil disetujui",
      data: updatedExpense,
    });
  } catch (error) {
    console.error("Approve edit error:", error);
    return NextResponse.json(
      { error: "Gagal menyetujui request edit", details: error.message },
      { status: 500 }
    );
  }
}

export const POST = protectedRoute(handleApproveEdit, ["ADMIN"]);
