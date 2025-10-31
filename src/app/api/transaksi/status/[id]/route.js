import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    const { payment_status } = await request.json();

    if (
      !payment_status ||
      !["UNPAID", "DOWN_PAYMENT", "PAID"].includes(payment_status)
    ) {
      return NextResponse.json(
        { error: "Status pembayaran tidak valid" },
        { status: 400 }
      );
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: idFromParams },
      data: {
        payment_status: payment_status,
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error(`Error updating payment status ${idFromParams}:`, error);
    return NextResponse.json(
      { error: "Gagal mengupdate status" },
      { status: 500 }
    );
  }
}
