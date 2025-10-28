import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
    const type = tipePaket === "Paket Tour" ? "TOUR_PACKAGE" : "CAR_RENTAL";

    const includes =
      typeof include === "string"
        ? include
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(include)
        ? include
        : [];

    const excludes =
      typeof exclude === "string"
        ? exclude
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(exclude)
        ? exclude
        : [];

    const updateData = {
      name: namaPaket,
      type,
      description: deskripsi || null,
      includes,
      excludes,
      isCustomizable: !!isCustomizable,
      customizableItems: customizableItems || [],
    };

    if (type === "CAR_RENTAL") {
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
    } else if (type === "TOUR_PACKAGE") {
      updateData.durationDays = durasiHari ? Number(durasiHari) : null;
      updateData.durationNights = durasiMalam ? Number(durasiMalam) : null;

      // prepare nested creates for hotel tiers and itineraries
      if (hotelTiers && Array.isArray(hotelTiers) && hotelTiers.length > 0) {
        updateData.hotelTiers = {
          create: hotelTiers.map((tier) => ({
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
          })),
        };
      }

      if (itineraries && Array.isArray(itineraries) && itineraries.length > 0) {
        updateData.itineraries = {
          create: itineraries.map((it) => ({
            day: it.hari ? Number(it.hari) : 0,
            title: it.aktivitas || String(it.title || ""),
            description: it.deskripsi || null,
          })),
        };
      }
    }

    // unwrap params and remove existing nested rows first to simplify update
    const { id } = await params;

    await prisma.hotel.deleteMany({
      where: { hotelTier: { servicePackageId: id } },
    });
    await prisma.hotelTier.deleteMany({
      where: { servicePackageId: id },
    });
    await prisma.itineraryDay.deleteMany({
      where: { servicePackageId: id },
    });

    const updatedPackage = await prisma.servicePackage.update({
      where: { id },
      data: updateData,
      include: {
        hotelTiers: {
          include: {
            hotels: true,
          },
        },
        itineraries: true,
      },
    });

    return NextResponse.json(updatedPackage);
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
