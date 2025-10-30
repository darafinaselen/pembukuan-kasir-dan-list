import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  const { id: idFromParams } = await params;

  console.log("PARAMS DITERIMA:", params);
  console.log("ID DIDAPAT:", idFromParams);

  try {
    const body = await request.json();
    const updatedData = await prisma.expense.update({
      where: { id: idFromParams },
      data: {
        date: body.date,
        category: body.category,
        description: body.description,
        amount: body.amount,
        armadaId: body.armadaId,
      },
    });
    return NextResponse.json(updatedData);
  } catch (error) {
    console.error(`Error updating pengeluaran ${idFromParams}:`, error);
    return NextResponse.json(
      { error: "Gagal mengupdate data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id: idFromParams } = await params;
  try {
    await prisma.expense.delete({
      where: { id: idFromParams },
    });
    return NextResponse.json(
      { message: "Data berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting pengeluaran ${id}:`, error);
    return NextResponse.json(
      { error: "Gagal menghapus data" },
      { status: 500 }
    );
  }
}
