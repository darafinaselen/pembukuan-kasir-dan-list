import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { protectedRoute } from "@/lib/middleware";
import { logTransactionEvent } from "@/lib/audit";

/**
 * POST /api/transactions/[id]/request-edit
 * Operator request untuk edit transaction
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

    // Get existing transaction
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

    // Check if transaction can be edited
    if (transaction.actual_checkin_datetime) {
      return NextResponse.json(
        { error: "Transaksi yang sudah selesai tidak dapat diedit" },
        { status: 403 }
      );
    }

    if (transaction.approval_status === "PENDING_EDIT") {
      return NextResponse.json(
        { error: "Transaksi sedang menunggu persetujuan edit" },
        { status: 403 }
      );
    }

    // Update transaction with edit request data
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        approval_status: "PENDING_EDIT",
        edit_request_reason: reason,
        proposed_changes: updatedData,
        requested_by_id: user.id,
        requested_at: new Date(),
        // Store original data for rollback if rejected
        original_data: {
          customer_name: transaction.customer_name,
          customer_phone: transaction.customer_phone,
          booking_date: transaction.booking_date,
          checkout_datetime: transaction.checkout_datetime,
          checkin_datetime: transaction.checkin_datetime,
          all_in_rate: transaction.all_in_rate,
          overtime_rate_per_hour: transaction.overtime_rate_per_hour,
          dp_amount: transaction.dp_amount,
          payment_status: transaction.payment_status,
          hotel_name: transaction.hotel_name,
          pax_count: transaction.pax_count,
          hotel_tier_id: transaction.hotel_tier_id,
          packageId: transaction.packageId,
          armadaId: transaction.armadaId,
          driverId: transaction.driverId,
        },
      },
      include: {
        package: true,
        armada: true,
        driver: true,
        requested_by: { select: { name: true, email: true } },
      },
    });

    // Log audit event
    await logTransactionEvent(user, "REQUEST_EDIT", updatedTransaction, req);

    return NextResponse.json({
      success: true,
      message: "Permintaan edit berhasil diajukan",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("Request edit transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengajukan permintaan edit" },
      { status: 500 }
    );
  }
}

export const POST = protectedRoute(handleRequestEdit, {
  roles: ["ADMIN", "OPERATOR"],
  permissions: ["canRequestTransactionEdit"],
});