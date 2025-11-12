import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validatePriceRangesForTier } from "@/lib/utils";
import {
  protectedRoute,
  successResponse,
  errorResponse,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { logPackageEvent } from "@/lib/audit";

const prisma = new PrismaClient();

async function handleGetPackage(request, { params }) {
  try {
    const { id } = await params;

    const packageData = await prisma.servicePackage.findUnique({
      where: { id },
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

    if (!packageData) {
      return errorResponse("Package not found", 404);
    }

    return successResponse(packageData);
  } catch (error) {
    console.error("Error fetching package:", error);
    return errorResponse("Failed to fetch package", 500);
  }
}

async function handleUpdatePackage(request, { params }) {
  try {
    const data = await request.json();
    console.log("=== PUT /api/packages/[id] ===");
    console.log("Received data:", JSON.stringify(data, null, 2));

    // Accept payloads shaped like the frontend form (Indonesian keys)
    const {
      tarifHotel: hotelTiers,
      itinerary: itineraries,
      namaPaket,
      tipePaket,
      deskripsi,
      isCustomizable,
      customizableItems,
      hargaDefault,
      tarifOvertime,
      include,
      exclude,
      durasi,
      ...rest
    } = data;

    // durations may come nested under `durasi` (hari/malam) or as top-level fields
    // durasiHari can mean either hours (for CAR_RENTAL/FULL_DAY_TRIP) or days (for TOUR_PACKAGE)
    const durasiHari = (durasi && durasi.hari) || data.durasiHari || null;
    const durasiMalam = (durasi && durasi.malam) || data.durasiMalam || null;

    // Map incoming form fields (Indonesian) to Prisma schema fields (English)
    const type =
      tipePaket === "Paket Tour"
        ? "TOUR_PACKAGE"
        : tipePaket === "Full Day Trip"
          ? "FULL_DAY_TRIP"
          : "CAR_RENTAL";

    console.log("Mapped type:", type);
    console.log("durasiHari received:", durasiHari);
    console.log("durasiMalam received:", durasiMalam);

    const includes =
      typeof include === "string"
        ? include
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : include;
    const excludes =
      typeof exclude === "string"
        ? exclude
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : exclude;

    const updateData = {
      name: namaPaket,
      type,
      description: deskripsi || null,
      includes: includes || [],
      excludes: excludes || [],
      isCustomizable: !!isCustomizable,
      customizableItems: customizableItems || [],
    };

    // Ensure fields are set/cleared according to the selected package type
    if (type === "TOUR_PACKAGE") {
      // Tour packages use durationDays/durationNights; clear price/overtime/hours
      updateData.durationDays = durasiHari ? Number(durasiHari) : null;
      updateData.durationNights = durasiMalam ? Number(durasiMalam) : null;
      updateData.price = null;
      updateData.durationHours = null;
      updateData.overtimeRate = null;
      console.log(
        "TOUR_PACKAGE: setting durationDays =",
        updateData.durationDays,
        "durationNights =",
        updateData.durationNights
      );
    } else if (type === "FULL_DAY_TRIP") {
      // Full day trips use durationHours, price, and overtimeRate
      updateData.price =
        typeof hargaDefault === "number"
          ? hargaDefault
          : hargaDefault
            ? Number(hargaDefault)
            : null;
      updateData.overtimeRate =
        typeof tarifOvertime === "number"
          ? tarifOvertime
          : tarifOvertime
            ? Number(tarifOvertime)
            : null;
      updateData.durationHours = durasiHari ? Number(durasiHari) : null;
      updateData.durationDays = null;
      updateData.durationNights = null;
      console.log(
        "FULL_DAY_TRIP: setting durationHours =",
        updateData.durationHours,
        "price =",
        updateData.price
      );
    } else if (type === "CAR_RENTAL") {
      // Car rentals use durationHours, price, and overtimeRate
      updateData.price =
        typeof hargaDefault === "number"
          ? hargaDefault
          : hargaDefault
            ? Number(hargaDefault)
            : null;
      updateData.overtimeRate =
        typeof tarifOvertime === "number"
          ? tarifOvertime
          : tarifOvertime
            ? Number(tarifOvertime)
            : null;
      updateData.durationHours = durasiHari ? Number(durasiHari) : null;
      updateData.durationDays = null;
      updateData.durationNights = null;
      console.log(
        "CAR_RENTAL: setting durationHours =",
        updateData.durationHours,
        "price =",
        updateData.price,
        "overtimeRate =",
        updateData.overtimeRate
      );
    }

    console.log("Update data prepared:", JSON.stringify(updateData, null, 2));

    const { id } = await params;
    console.log("Package ID to update:", id);

    // Verify package exists
    const existingPackage = await prisma.servicePackage.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      console.error("Package not found:", id);
      return errorResponse("Package not found", 404);
    }

    console.log("Existing package found:", existingPackage.name);

    // Smartly update hotel tiers and itineraries
    const tx = [];

    // Delete old data first (only related data, not the package itself)
    console.log("Deleting old hotel tiers and itineraries...");
    tx.push(
      prisma.hotelPriceRange.deleteMany({
        where: { hotelTier: { servicePackageId: id } },
      })
    );
    tx.push(
      prisma.hotel.deleteMany({
        where: { hotelTier: { servicePackageId: id } },
      })
    );
    tx.push(
      prisma.hotelTier.deleteMany({
        where: { servicePackageId: id },
      })
    );
    tx.push(
      prisma.itineraryDay.deleteMany({
        where: { servicePackageId: id },
      })
    );

    // Then, update the main package data
    console.log("Updating main package data...");
    tx.push(
      prisma.servicePackage.update({
        where: { id },
        data: updateData,
      })
    );

    // Then, create new hotel tiers and itineraries if they exist
    if (
      type === "TOUR_PACKAGE" &&
      hotelTiers &&
      Array.isArray(hotelTiers) &&
      hotelTiers.length > 0
    ) {
      console.log("Creating new hotel tiers...", hotelTiers.length);
      // validate priceRanges for each tier
      for (let i = 0; i < hotelTiers.length; i++) {
        const tier = hotelTiers[i];
        if (tier.priceRanges) {
          const v = validatePriceRangesForTier(tier.priceRanges);
          if (!v.ok) {
            console.error("Price range validation failed:", v.message);
            return errorResponse(
              `Validasi priceRanges gagal di tingkat ke-${i + 1}: ${v.message}`,
              400
            );
          }
        }
      }

      tx.push(
        ...hotelTiers.map((tier, idx) => {
          console.log(`Creating hotel tier ${idx + 1}:`, tier);
          return prisma.hotelTier.create({
            data: {
              servicePackageId: id,
              starRating: (() => {
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
            },
          });
        })
      );
    }

    if (
      (type === "TOUR_PACKAGE" || type === "FULL_DAY_TRIP") &&
      itineraries &&
      Array.isArray(itineraries) &&
      itineraries.length > 0
    ) {
      console.log("Creating new itineraries...", itineraries.length);
      tx.push(
        ...itineraries.map((it, idx) => {
          console.log(`Creating itinerary ${idx + 1}:`, it);
          return prisma.itineraryDay.create({
            data: {
              servicePackageId: id,
              day: it.hari ? Number(it.hari) : 0,
              title: it.aktivitas || String(it.title || ""),
              description: it.deskripsi || null,
            },
          });
        })
      );
    }

    console.log("Executing transaction with", tx.length, "operations...");
    await prisma.$transaction(tx);
    console.log("Transaction completed successfully");

    const result = await prisma.servicePackage.findUnique({
      where: { id },
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
      "UPDATE",
      id,
      { name: result.name, type: result.type },
      getClientIp(request),
      getUserAgent(request)
    );

    console.log("Updated package result:", result?.name);
    return successResponse(result);
  } catch (error) {
    console.error("=== PUT /api/packages/[id] ERROR ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    return errorResponse("Failed to update package", 500, {
      details: error.message,
    });
  }
}

async function handleDeletePackage(request, { params }) {
  try {
    const { id } = await params;

    // Get package data before deletion for audit log
    const existingPackage = await prisma.servicePackage.findUnique({
      where: { id },
      select: { id: true, name: true, type: true },
    });

    if (!existingPackage) {
      return errorResponse("Package not found", 404);
    }

    await prisma.servicePackage.delete({
      where: { id },
    });

    // Log audit event
    await logPackageEvent(
      request.auth.user.id,
      "DELETE",
      id,
      { name: existingPackage.name, type: existingPackage.type },
      getClientIp(request),
      getUserAgent(request)
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting package:", error);
    return errorResponse("Failed to delete package", 500);
  }
}

// All roles can view packages
export const GET = protectedRoute(handleGetPackage, {
  roles: ["ADMIN", "MANAGER", "OPERATOR"],
});

// Only ADMIN and MANAGER can update packages
export const PUT = protectedRoute(handleUpdatePackage, {
  roles: ["ADMIN", "MANAGER"],
});

// Only ADMIN and MANAGER can delete packages
export const DELETE = protectedRoute(handleDeletePackage, {
  roles: ["ADMIN", "MANAGER"],
});
