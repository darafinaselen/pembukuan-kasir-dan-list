import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { protectedRoute } from "@/lib/middleware";
import { logExpenseApprovalEvent } from "@/lib/audit";

/**
 * POST /api/expenses/[id]/request-edit
 * Operator request untuk edit expense yang sudah approved
 */
async function handleRequestEdit(req, { params }) {
try {
  const { id } = await params;
  const body = await req.json();
  const { reason, updatedData } = body;
  const user = req.auth.user;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Alasan request harus diisi" },
        { status: 400 }
      );
    }

    if (!updatedData) {
      return NextResponse.json(
        { error: "Data yang akan diupdate harus disertakan" },
        { status: 400 }
      );
    }

    // Get existing expense
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        armada: true,
        driver: true,
        staff: true,
        attachments: true,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Pengeluaran tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if already has pending request
    if (
      expense.approval_status === "PENDING_EDIT" ||
      expense.approval_status === "PENDING_DELETE"
    ) {
      return NextResponse.json(
        { error: "Pengeluaran ini sudah memiliki request yang pending" },
        { status: 400 }
      );
    }

    // Backup original data (exclude relations)
    const originalData = {
      date: expense.date,
      paymentMonth: expense.paymentMonth,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      armadaId: expense.armadaId,
      driverId: expense.driverId,
      staffId: expense.staffId,
      namaPenerima: expense.namaPenerima,
    };

    // Store proposed changes
    const proposedChanges = {
      date: updatedData.date,
      paymentMonth: updatedData.paymentMonth,
      category: updatedData.category,
      description: updatedData.description,
      amount: updatedData.amount,
      armadaId: updatedData.armadaId,
      driverId: updatedData.driverId,
      staffId: updatedData.staffId,
      namaPenerima: updatedData.namaPenerima,
    };

    // Update expense dengan status PENDING_EDIT
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        approval_status: "PENDING_EDIT",
        edit_request_reason: reason,
        original_data: originalData,
        proposed_changes: proposedChanges,
        requested_by_id: user.id,
        requested_at: new Date(),
      },
      include: {
        armada: true,
        driver: true,
        staff: true,
        requested_by: { select: { name: true, email: true } },
      },
    });

    // Log audit event
    await logExpenseApprovalEvent(user, "REQUEST_EDIT", updatedExpense, req, {
      reason,
      updatedData,
      original_data: originalData,
    });

    return NextResponse.json({
      success: true,
      message: "Request edit berhasil diajukan",
      data: updatedExpense,
    });
  } catch (error) {
    console.error("Request edit error:", error);
    return NextResponse.json(
      { error: "Gagal mengajukan request edit", details: error.message },
      { status: 500 }
    );
  }
}

export const POST = protectedRoute(handleRequestEdit, ["OPERATOR", "ADMIN"]);
