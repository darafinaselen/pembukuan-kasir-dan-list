import {
  protectedRoute,
  successResponse,
  errorResponse,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { validatePriceRangesForTier } from "@/lib/utils";
import { logPackageEvent } from "@/lib/audit";

async function handleGetPackages(request) {
  try {
    // All roles can view packages
    const packages = await prisma.servicePackage.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        includes: true,
        excludes: true,
        isCustomizable: true,
        customizableItems: true,
        // CAR_RENTAL fields
        price: true,
        durationHours: true,
        overtimeRate: true,
        // TOUR_PACKAGE fields
        durationDays: true,
        durationNights: true,
        createdAt: true,
        updatedAt: true,
        // Relations
        hotelTiers: {
          select: {
            id: true,
            starRating: true,
            pricePerPax: true,
            createdAt: true,
            updatedAt: true,
            hotels: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            priceRanges: {
              select: {
                id: true,
                minPax: true,
                maxPax: true,
                price: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        itineraries: {
          select: {
            id: true,
            day: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        transactions: {
          select: {
            id: true,
          },
        },
      },
    });
    return successResponse(packages);
  } catch (error) {
    console.error(error);
    // If the packages table doesn't exist yet (local dev), return an empty array so UI can render.
    if (error?.code === "P2021") {
      return successResponse([]);
    }
    return errorResponse(
      "Failed to fetch packages",
      500,
      process.env.NODE_ENV === "development"
        ? {
            message: error?.message,
            stack: error?.stack,
          }
        : null
    );
  }
}

async function handleCreatePackage(request) {
  try {
    // Check permissions - only ADMIN and MANAGER can create
    if (!["ADMIN", "MANAGER"].includes(request.auth.user.role)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const data = await request.json();
    const {
      tarifHotel: hotelTiers,
      itinerary: itineraries,
      namaPaket,
      tipePaket,
      deskripsi,
      durasiHari,
      durasiMalam,
      isCustomizable,
      customizableItems,
      hargaDefault,
      tarifOvertime,
      include,
      exclude,
      ...rest
    } = data;
    // Support nested `durasi` object from the form as well
    const nestedDurasiHari = data?.durasi?.hari;
    const nestedDurasiMalam = data?.durasi?.malam;

    // Map incoming form fields (Indonesian) to Prisma schema fields (English)
    const type =
      tipePaket === "Paket Tour"
        ? "TOUR_PACKAGE"
        : tipePaket === "Full Day Trip"
          ? "FULL_DAY_TRIP"
          : "CAR_RENTAL";

    const includes =
      typeof include === "string"
        ? include
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    const excludes =
      typeof exclude === "string"
        ? exclude
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const prismaData = {
      name: namaPaket,
      type,
      description: deskripsi || null,
      includes,
      excludes,
      isCustomizable: !!isCustomizable,
      customizableItems: customizableItems || [],
      // extra rest fields will be ignored on purpose
    };

    if (type === "CAR_RENTAL" || type === "FULL_DAY_TRIP") {
      prismaData.price =
        typeof hargaDefault === "number"
          ? hargaDefault
          : hargaDefault
            ? Number(hargaDefault)
            : null;
      prismaData.overtimeRate =
        typeof tarifOvertime === "number"
          ? tarifOvertime
          : tarifOvertime
            ? Number(tarifOvertime)
            : null;
      // For CAR_RENTAL and FULL_DAY_TRIP, durasiHari represents hours
      const hours = nestedDurasiHari ?? durasiHari;
      prismaData.durationHours = hours ? Number(hours) : null;
    }

    if (type === "TOUR_PACKAGE") {
      const days = nestedDurasiHari ?? durasiHari;
      const nights = nestedDurasiMalam ?? durasiMalam;
      prismaData.durationDays = days ? Number(days) : null;
      prismaData.durationNights = nights ? Number(nights) : null;

      if (hotelTiers && Array.isArray(hotelTiers) && hotelTiers.length > 0) {
        // validate priceRanges for each tier
        for (let i = 0; i < hotelTiers.length; i++) {
          const tier = hotelTiers[i];
          if (tier.priceRanges) {
            const v = validatePriceRangesForTier(tier.priceRanges);
            if (!v.ok) {
              return errorResponse(
                `Validasi priceRanges gagal di tingkat ke-${i + 1}: ${v.message}`,
                400
              );
            }
          }
        }

        prismaData.hotelTiers = {
          create: hotelTiers.map((tier) => ({
            starRating: (() => {
              // tier.tingkat is like "Bintang 3"
              const m = String(tier.tingkat || "").match(/\d+/);
              return m ? Number(m[0]) : tier.starRating || 0;
            })(),
            pricePerPax: tier.tarifPerPax ? Number(tier.tarifPerPax) : 0,
            hotels:
              tier.daftarHotel && Array.isArray(tier.daftarHotel)
                ? {
                    create: tier.daftarHotel.map((hotelName) => ({
                      name: String(hotelName),
                    })),
                  }
                : undefined,
            priceRanges:
              tier.priceRanges && Array.isArray(tier.priceRanges)
                ? {
                    create: tier.priceRanges.map((r) => ({
                      minPax: Number(r.minPax || 0),
                      maxPax: Number(r.maxPax || 0),
                      price: Number(r.price || 0),
                    })),
                  }
                : undefined,
          })),
        };
      }
    }

    if (type === "TOUR_PACKAGE" || type === "FULL_DAY_TRIP") {
      if (itineraries && Array.isArray(itineraries) && itineraries.length > 0) {
        prismaData.itineraries = {
          create: itineraries.map((it) => ({
            day: it.hari ? Number(it.hari) : 0,
            title: it.aktivitas || String(it.title || ""),
            description: it.deskripsi || null,
          })),
        };
      }
    }

    const newPackage = await prisma.servicePackage.create({
      data: prismaData,
      include: {
        hotelTiers: {
          include: {
            hotels: true,
            priceRanges: true,
          },
        },
        itineraries: true,
      },
    });

    // Log audit event
    await logPackageEvent(
      request.auth.user.id,
      "CREATE",
      newPackage.id,
      { name: newPackage.name, type: newPackage.type },
      getClientIp(request),
      getUserAgent(request)
    );

    return successResponse(newPackage, 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Failed to create package", 500);
  }
}

// All roles can view packages
export const GET = protectedRoute(handleGetPackages, {
  roles: ["ADMIN", "MANAGER", "OPERATOR"],
});

// Only ADMIN and MANAGER can create packages
export const POST = protectedRoute(handleCreatePackage, {
  roles: ["ADMIN", "MANAGER"],
});
