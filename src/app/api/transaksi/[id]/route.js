import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: idFromParams },
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
    return NextResponse.json(transaction);
  } catch (error) {
    console.error(`Error fetching transaction ${idFromParams}:`, error);
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    const body = await request.json();
    const { armadaId, driverId, packageId, ...transactionData } = body;

    const updatedTransaction = await prisma.transaction.update({
      where: { id: idFromParams },
      data: {
        ...transactionData,
        armadaId: armadaId,
        driverId: driverId,
        packageId: packageId || null,
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error(`Error updating transaction ${idFromParams}:`, error);
    return NextResponse.json(
      { error: "Gagal mengupdate data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id: idFromParams } = await params;

  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: idFromParams },
      select: { armadaId: true, driverId: true },
    });

    if (!tx) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.transaction.delete({
        where: { id: idFromParams },
      }),

      prisma.armada.update({
        where: { id: tx.armadaId },
        data: { status: "READY" },
      }),

      prisma.driver.update({
        where: { id: tx.driverId },
        data: { status: "READY" },
      }),
    ]);

    return NextResponse.json(
      {
        message:
          "Data transaksi berhasil dihapus dan status armada/sopir di-reset",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting transaction ${idFromParams}:`, error);
    return NextResponse.json(
      { error: "Gagal menghapus data" },
      { status: 500 }
    );
  }
}
