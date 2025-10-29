import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validatePriceRangesForTier } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const packages = await prisma.servicePackage.findMany({
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
    return NextResponse.json(packages);
  } catch (error) {
    console.error(error);
    // If the packages table doesn't exist yet (local dev), return an empty array so UI can render.
    if (error?.code === "P2021") {
      return NextResponse.json([], { status: 200 });
    }
    // Return error details in dev for quicker debugging
    return NextResponse.json(
      {
        error: "Failed to fetch packages",
        message: error?.message,
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
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
    }

    if (type === "TOUR_PACKAGE") {
      prismaData.durationDays = durasiHari ? Number(durasiHari) : null;
      prismaData.durationNights = durasiMalam ? Number(durasiMalam) : null;

      if (hotelTiers && Array.isArray(hotelTiers) && hotelTiers.length > 0) {
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

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
