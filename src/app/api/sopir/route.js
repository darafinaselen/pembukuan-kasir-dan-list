import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany();
    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { message: "Error fetching drivers" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { driver_name, nik, phone_number, address, status } = data;

    if (!driver_name || !phone_number) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newDriver = await prisma.driver.create({
      data: {
        driver_name,
        nik,
        phone_number,
        address,
        status,
      },
    });
    return NextResponse.json(newDriver, { status: 201 });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { message: "Error creating driver" },
      { status: 500 }
    );
  }
}
