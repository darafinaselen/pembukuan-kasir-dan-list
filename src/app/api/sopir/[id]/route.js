import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const data = await request.json();
    const { driver_name, nik, phone_number, address, status } = data;

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        driver_name,
        nik,
        phone_number,
        address,
        status,
      },
    });
    return NextResponse.json(updatedDriver);
  } catch (error) {
    console.error(`Error updating driver ${id}:`, error);
    return NextResponse.json(
      { message: `Error updating driver ${id}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.driver.delete({
      where: { id },
    });
    return NextResponse.json({ message: `Driver ${id} deleted successfully` });
  } catch (error) {
    console.error(`Error deleting driver ${id}:`, error);
    return NextResponse.json(
      { message: `Error deleting driver ${id}` },
      { status: 500 }
    );
  }
}
