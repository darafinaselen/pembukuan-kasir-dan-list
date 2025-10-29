import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validatePriceRangesForTier } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
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
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(packageData);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
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
    const durasiHari = (durasi && durasi.hari) || data.durasiHari || null;
    const durasiMalam = (durasi && durasi.malam) || data.durasiMalam || null;

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
      // Tour packages use durations and hotel tiers; clear price/overtime
      updateData.durationDays = durasiHari ? Number(durasiHari) : null;
      updateData.durationNights = durasiMalam ? Number(durasiMalam) : null;
      updateData.price = null;
      updateData.overtimeRate = null;
    } else if (type === "FULL_DAY_TRIP") {
      // Full day trips use price/overtime and itineraries and may have durations
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
      updateData.durationDays = durasiHari ? Number(durasiHari) : null;
      updateData.durationNights = durasiMalam ? Number(durasiMalam) : null;
    } else if (type === "CAR_RENTAL") {
      // Car rentals use price/overtime; clear duration fields and tour-specific data
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
      updateData.durationDays = null;
      updateData.durationNights = null;
    }

    const { id } = await params;

    // Smartly update hotel tiers and itineraries
    const tx = [];

    // Delete old data first
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
      // validate priceRanges for each tier
      for (let i = 0; i < hotelTiers.length; i++) {
        const tier = hotelTiers[i];
        if (tier.priceRanges) {
          const v = validatePriceRangesForTier(tier.priceRanges);
          if (!v.ok) {
            return NextResponse.json(
              {
                error: `Validasi priceRanges gagal di tingkat ke-${i + 1}: ${
                  v.message
                }`,
              },
              { status: 400 }
            );
          }
        }
      }

      tx.push(
        ...hotelTiers.map((tier) =>
          prisma.hotelTier.create({
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
          })
        )
      );
    }

    if (
      (type === "TOUR_PACKAGE" || type === "FULL_DAY_TRIP") &&
      itineraries &&
      Array.isArray(itineraries) &&
      itineraries.length > 0
    ) {
      tx.push(
        ...itineraries.map((it) =>
          prisma.itineraryDay.create({
            data: {
              servicePackageId: id,
              day: it.hari ? Number(it.hari) : 0,
              title: it.aktivitas || String(it.title || ""),
              description: it.deskripsi || null,
            },
          })
        )
      );
    }
    const updatedPackage = await prisma.$transaction(tx);

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

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.servicePackage.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
