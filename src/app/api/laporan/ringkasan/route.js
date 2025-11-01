import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { calculateTransactionFinancials } from "@/lib/accounting";

const prisma = new PrismaClient();

/**
 * Calculate financial metrics for a transaction
 * Uses centralized accounting utility for consistency
 * @deprecated Use calculateTransactionFinancials from @/lib/accounting instead
 */
function calculateTxFinancials(tx) {
  return calculateTransactionFinancials(tx);
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Rentang tanggal wajib diisi" },
        { status: 400 }
      );
    }

    const dateFilterTx = {
      booking_date: { gte: new Date(from), lte: new Date(to) },
    };
    const dateFilterEx = { date: { gte: new Date(from), lte: new Date(to) } };

    const transactions = await prisma.transaction.findMany({
      where: dateFilterTx,
      include: {
        package: true,
        armada: true,
        driver: true,
      },
    });

    let totalPemasukanSewa = 0;
    let totalBiayaOps = 0;
    let totalLabaKotor = 0;

    const bbmMap = new Map();
    const gajiMap = new Map();

    for (const tx of transactions) {
      const financials = calculateTxFinancials(tx);
      totalPemasukanSewa += financials.totalPendapatan;
      totalBiayaOps += financials.totalBiayaOps;
      totalLabaKotor += financials.labaKotor;

      const bulan = format(new Date(tx.booking_date), "MMMM yyyy", {
        locale: id,
      });

      if (tx.armada) {
        const key = tx.armadaId;
        const current = bbmMap.get(key) || {
          bulan: bulan,
          platMobil: `${tx.armada.license_plate} (${tx.armada.model})`,
          totalBBM: 0,
        };
        current.totalBBM += tx.fuel_cost || 0;
        bbmMap.set(key, current);
      }

      if (tx.driver) {
        const key = tx.driverId;
        const current = gajiMap.get(key) || {
          bulan: bulan,
          namaSopir: tx.driver.driver_name,
          totalGaji: 0,
        };
        current.totalGaji += tx.driver_fee || 0;
        gajiMap.set(key, current);
      }
    }

    const expenseAggregation = await prisma.expense.aggregate({
      where: dateFilterEx,
      _sum: {
        amount: true,
      },
    });

    const totalBiayaKantor = expenseAggregation._sum.amount || 0;

    const laporanTransaksi = {
      totalTransaksi: transactions.length,
      totalPemasukan: totalPemasukanSewa,
      totalPengeluaranOps: totalBiayaOps,
      totalLabaKotor: totalLabaKotor,
    };

    const laporanLabaRugi = {
      totalPemasukanSewa: totalPemasukanSewa,
      totalBiayaOps: totalBiayaOps,
      totalBiayaKantor: totalBiayaKantor,
      labaRugiBersih: totalPemasukanSewa - totalBiayaOps - totalBiayaKantor,
    };

    const rekapBBM = Array.from(bbmMap.values());
    const rekapGaji = Array.from(gajiMap.values());

    return NextResponse.json({
      laporanTransaksi,
      laporanLabaRugi,
      rekapBBM,
      rekapGaji,
    });
  } catch (error) {
    console.error("Error fetching report data:", error);
    return NextResponse.json(
      { error: "Gagal memuat data laporan" },
      { status: 500 }
    );
  }
}
