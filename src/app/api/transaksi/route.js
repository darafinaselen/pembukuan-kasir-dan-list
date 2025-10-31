import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        booking_date: "desc",
      },
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const { armadaId, driverId, packageId, ...transactionData } = body;

    if (!armadaId || !driverId) {
      return NextResponse.json(
        { error: "Armada dan Sopir wajib diisi" },
        { status: 400 }
      );
    }

    const isStartingTodayOrPast =
      new Date(body.checkout_datetime) <= new Date();
    const armadaStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";

    const driverStatus = "ON_TRIP";

    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
    const invoice_code = `RLM-${yyyymmdd}-${date
      .getTime()
      .toString()
      .slice(-5)}`;

    const [newTransaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          ...transactionData,
          invoice_code: invoice_code,
          armadaId: armadaId,
          driverId: driverId,
          packageId: packageId || null,
        },
      }),

      prisma.armada.update({
        where: { id: armadaId },
        data: { status: armadaStatus },
      }),

      prisma.driver.update({
        where: { id: driverId },
        data: { status: driverStatus },
      }),
    ]);

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Gagal membuat invoice code unik. Coba lagi." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat transaksi" },
      { status: 500 }
    );
  }
}
