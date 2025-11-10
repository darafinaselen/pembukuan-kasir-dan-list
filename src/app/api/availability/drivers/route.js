import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/availability/drivers
 * Mengecek ketersediaan sopir berdasarkan rentang tanggal
 * 
 * Query params:
 * - checkout_datetime: ISO datetime string (required)
 * - checkin_datetime: ISO datetime string (required)
 * - excludeTransactionId: string (optional) - exclude transaction saat edit
 */
async function handleCheckDriverAvailability(request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutDatetime = searchParams.get("checkout_datetime");
    const checkinDatetime = searchParams.get("checkin_datetime");
    const excludeTransactionId = searchParams.get("excludeTransactionId");

    if (!checkoutDatetime || !checkinDatetime) {
      return errorResponse(
        "checkout_datetime dan checkin_datetime wajib diisi",
        400
      );
    }

    const checkout = new Date(checkoutDatetime);
    const checkin = new Date(checkinDatetime);

    if (checkin <= checkout) {
      return errorResponse(
        "checkin_datetime harus lebih besar dari checkout_datetime",
        400
      );
    }

    // Cari semua transaksi yang overlap dengan rentang tanggal yang diminta
    const overlappingTransactions = await prisma.transaction.findMany({
      where: {
        // Exclude transaction yang sedang diedit
        ...(excludeTransactionId
          ? { id: { not: excludeTransactionId } }
          : {}),
        // Hanya transaksi yang belum selesai atau masih dalam rentang
        OR: [
          {
            // Transaksi yang belum selesai (masih aktif)
            actual_checkin_datetime: null,
            // Overlap check: checkout baru < checkin transaksi yang ada
            // DAN checkin baru > checkout transaksi yang ada
            checkout_datetime: { lt: checkin },
            checkin_datetime: { gt: checkout },
          },
          {
            // Transaksi yang sudah selesai tapi masih dalam rentang
            actual_checkin_datetime: { not: null },
            checkout_datetime: { lt: checkin },
            actual_checkin_datetime: { gt: checkout },
          },
        ],
      },
      select: {
        driverId: true,
      },
    });

    // Ambil ID sopir yang sedang digunakan
    const busyDriverIds = new Set(
      overlappingTransactions.map((t) => t.driverId)
    );

    // Ambil semua sopir yang tersedia (status READY atau tidak dalam daftar busy)
    const availableDrivers = await prisma.driver.findMany({
      where: {
        status: "READY",
        id: {
          notIn: Array.from(busyDriverIds),
        },
      },
      orderBy: {
        driver_name: "asc",
      },
    });

    // Ambil juga sopir yang statusnya bukan READY untuk informasi
    const allDrivers = await prisma.driver.findMany({
      orderBy: {
        driver_name: "asc",
      },
    });

    return successResponse({
      available: availableDrivers,
      busy: allDrivers.filter((d) => busyDriverIds.has(d.id)),
      unavailable: allDrivers.filter(
        (d) => d.status !== "READY" && !busyDriverIds.has(d.id)
      ),
      total: allDrivers.length,
      availableCount: availableDrivers.length,
      busyCount: busyDriverIds.size,
    });
  } catch (error) {
    console.error("Error checking driver availability:", error);
    return errorResponse("Gagal mengecek ketersediaan sopir", 500);
  }
}

export const GET = protectedRoute(handleCheckDriverAvailability, {
  roles: ["ADMIN", "MANAGER", "OPERATOR"],
});

