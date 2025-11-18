import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/availability/vehicles
 * Mengecek ketersediaan armada berdasarkan rentang tanggal
 * 
 * Query params:
 * - checkout_datetime: ISO datetime string (required)
 * - checkin_datetime: ISO datetime string (required)
 * - excludeTransactionId: string (optional) - exclude transaction saat edit
 */
async function handleCheckVehicleAvailability(request) {
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
    // Overlap terjadi jika:
    // - checkout baru dimulai sebelum checkin transaksi yang ada selesai
    // - checkin baru terjadi setelah checkout transaksi yang ada dimulai
    const overlappingTransactions = await prisma.transaction.findMany({
      where: {
        // Exclude transaction yang sedang diedit
        ...(excludeTransactionId
          ? { id: { not: excludeTransactionId } }
          : {}),
        // Hanya transaksi yang belum selesai (belum ada actual_checkin_datetime)
        // atau transaksi yang masih aktif
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
        armadaId: true,
      },
    });

    // Ambil ID armada yang sedang digunakan
    const busyVehicleIds = new Set(
      overlappingTransactions.map((t) => t.armadaId)
    );

    // Ambil semua armada yang tersedia (status READY atau tidak dalam daftar busy)
    const availableVehicles = await prisma.armada.findMany({
      where: {
        status: "READY",
        id: {
          notIn: Array.from(busyVehicleIds),
        },
      },
      orderBy: {
        license_plate: "asc",
      },
    });

    // Ambil juga armada yang statusnya bukan READY untuk informasi
    const allVehicles = await prisma.armada.findMany({
      orderBy: {
        license_plate: "asc",
      },
    });

    return successResponse({
      available: availableVehicles,
      busy: allVehicles.filter((v) => busyVehicleIds.has(v.id)),
      unavailable: allVehicles.filter(
        (v) => v.status !== "READY" && !busyVehicleIds.has(v.id)
      ),
      total: allVehicles.length,
      availableCount: availableVehicles.length,
      busyCount: busyVehicleIds.size,
    });
  } catch (error) {
    console.error("Error checking vehicle availability:", error);
    return errorResponse("Gagal mengecek ketersediaan armada", 500);
  }
}

// ADMIN and OPERATOR can check vehicle availability
export const GET = protectedRoute(handleCheckVehicleAvailability, {
  roles: ["ADMIN", "OPERATOR"],
});

