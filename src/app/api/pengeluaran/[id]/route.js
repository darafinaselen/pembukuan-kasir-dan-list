import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  const { id } = params;
  try {
    const body = await request.json();
    const updatedData = await prisma.pengeluaran.update({
      where: { id: id },
      data: {
        tanggal: body.tanggal,
        kategori: body.kategori,
        deskripsi: body.deskripsi,
        jumlah: body.jumlah,
        armadaId: body.armadaId,
      },
    });
    return NextResponse.json(updatedData);
  } catch (error) {
    console.error(`Error updating pengeluaran ${id}:`, error);
    return NextResponse.json(
      { error: "Gagal mengupdate data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  try {
    await prisma.pengeluaran.delete({
      where: { id: id },
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
