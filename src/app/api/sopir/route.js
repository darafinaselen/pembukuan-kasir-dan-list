import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

async function handleGetDrivers(request) {
  try {
    // All roles can view drivers
    const drivers = await prisma.driver.findMany();
    return successResponse(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return errorResponse("Error fetching drivers", 500);
  }
}

async function handleCreateDriver(request) {
  try {
    // Check permissions - only ADMIN and MANAGER can create
    if (!["ADMIN", "MANAGER"].includes(request.auth.user.role)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const data = await request.json();
    const { driver_name, nik, phone_number, address, status } = data;

    if (!driver_name || !phone_number) {
      return errorResponse("Missing required fields", 400);
    }

    const newDriver = await prisma.driver.create({
      data: {
        driver_name,
        nik,
        phone_number,
        address,
        status,
      },
    });

    return successResponse(newDriver, 201);
  } catch (error) {
    console.error("Error creating driver:", error);
    return errorResponse("Error creating driver", 500);
  }
}

// All roles can view drivers
export const GET = protectedRoute(handleGetDrivers, {
  roles: ["ADMIN", "MANAGER", "OPERATOR"],
});

// Only ADMIN and MANAGER can create drivers
export const POST = protectedRoute(handleCreateDriver, {
  roles: ["ADMIN", "MANAGER"],
});
