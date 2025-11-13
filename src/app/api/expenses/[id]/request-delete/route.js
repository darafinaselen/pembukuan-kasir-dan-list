import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { protectedRoute } from "@/lib/middleware";
import { logExpenseApprovalEvent } from "@/lib/audit";

/**
 * POST /api/expenses/[id]/request-delete
 * Operator request untuk delete expense yang sudah approved
 */
async function handleRequestDelete(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { reason } = body;
    const user = req.user;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Alasan request delete harus diisi" },
        { status: 400 }
      );
    }

    // Get existing expense
    const expense = await prisma.expense.findUnique({
      where: { id },
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

    // Update expense dengan status PENDING_DELETE
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        approval_status: "PENDING_DELETE",
        delete_request_reason: reason,
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
    await logExpenseApprovalEvent(user, "REQUEST_DELETE", updatedExpense, req, {
      reason,
    });

    return NextResponse.json({
      success: true,
      message: "Request delete berhasil diajukan",
      data: updatedExpense,
    });
  } catch (error) {
    console.error("Request delete error:", error);
    return NextResponse.json(
      { error: "Gagal mengajukan request delete", details: error.message },
      { status: 500 }
    );
  }
}

export const POST = protectedRoute(handleRequestDelete, ["OPERATOR", "ADMIN"]);
