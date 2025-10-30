import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const data = await prisma.expense.findMany({
      orderBy: {
        date: "desc",
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching pengeluaran:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.date || !body.category || !body.description || !body.amount) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const newData = await prisma.expense.create({
      data: {
        date: body.date,
        category: body.category,
        description: body.description,
        amount: body.amount,
        armadaId: body.armadaId,
      },
    });
    return NextResponse.json(newData, { status: 201 });
  } catch (error) {
    console.error("Error creating pengeluaran:", error);
    return NextResponse.json({ error: "Gagal membuat data" }, { status: 500 });
  }
}
