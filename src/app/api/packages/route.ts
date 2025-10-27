import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const packages = await prisma.servicePackage.findMany({
      include: {
        hotelTiers: {
          include: {
            hotels: true,
          },
        },
        itineraries: true,
      },
    });
    return NextResponse.json(packages);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { hotelTiers, itineraries, ...packageData } = data;

    const newPackage = await prisma.servicePackage.create({
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

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
