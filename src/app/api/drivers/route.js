import {
  protectedRoute,
  successResponse,
  errorResponse,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logDriverEvent } from "@/lib/audit";

async function handleGetDrivers(request) {
  try {
    // All roles can view drivers
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const whereClause = statusFilter ? { status: statusFilter } : {};

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
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

    // Log audit event
    await logDriverEvent(
      request.auth.user.id,
      "CREATE",
      newDriver.id,
      newDriver,
      getClientIp(request),
      getUserAgent(request)
    );

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
