import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const data = await request.json();
    const { license_plate, brand, model, status } = data;

    const updatedArmada = await prisma.armada.update({
      where: { id },
      data: {
        license_plate,
        brand,
        model,
        status,
      },
    });
    return NextResponse.json(updatedArmada);
  } catch (error) {
    console.error(`Error updating armada ${id}:`, error);
    return NextResponse.json(
      { message: `Error updating armada ${id}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.armada.delete({
      where: { id },
    });
    return NextResponse.json({ message: `Armada ${id} deleted successfully` });
  } catch (error) {
    console.error(`Error deleting armada ${id}:`, error);
    return NextResponse.json(
      { message: `Error deleting armada ${id}` },
      { status: 500 }
    );
  }
}
