import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Return armadas in a stable order. Without explicit ordering
    // the database may return rows in arbitrary order which makes UI
    // appear to reshuffle after updates. Order by createdAt descending
    // so newest entries appear first.
    const armadas = await prisma.armada.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(armadas);
  } catch (error) {
    console.error("Error fetching armadas:", error);
    return NextResponse.json(
      { message: "Error fetching armadas" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { license_plate, brand, model, status } = data;

    if (!license_plate || !brand || !model) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newArmada = await prisma.armada.create({
      data: {
        license_plate,
        brand,
        model,
        status,
      },
    });
    return NextResponse.json(newArmada, { status: 201 });
  } catch (error) {
    console.error("Error creating armada:", error);
    return NextResponse.json(
      { message: "Error creating armada" },
      { status: 500 }
    );
  }
}
