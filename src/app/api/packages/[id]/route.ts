import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packageData = await prisma.servicePackage.findUnique({
      where: { id: params.id },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { hotelTiers, itineraries, ...packageData } = data;

    // First, delete existing related data
    await prisma.hotel.deleteMany({
      where: { hotelTier: { servicePackageId: params.id } },
    });
    await prisma.hotelTier.deleteMany({
      where: { servicePackageId: params.id },
    });
    await prisma.itineraryDay.deleteMany({
      where: { servicePackageId: params.id },
    });

    const updatedPackage = await prisma.servicePackage.update({
      where: { id: params.id },
      data: {
        ...packageData,
        hotelTiers: {
          create: hotelTiers?.map((tier: any) => ({
            ...tier,
            hotels: {
              create: tier.hotels?.map((hotel: any) => ({
                name: hotel.name,
              })),
            },
          })),
        },
        itineraries: {
          create: itineraries?.map((itinerary: any) => ({
            ...itinerary,
          })),
        },
      },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.servicePackage.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
