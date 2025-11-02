import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

async function handleUpdateDriver(request, { params }) {
  const { id } = await params;

  try {
    // Check permissions - only ADMIN and MANAGER can update
    if (!["ADMIN", "MANAGER"].includes(request.auth.user.role)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const data = await request.json();
    const { driver_name, nik, phone_number, address, status } = data;

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        driver_name,
        nik,
        phone_number,
        address,
        status,
      },
    });

    return successResponse(updatedDriver);
  } catch (error) {
    console.error(`Error updating driver ${id}:`, error);
    return errorResponse(`Error updating driver ${id}`, 500);
  }
}

async function handleDeleteDriver(request, { params }) {
  const { id } = await params;

  try {
    // Check permissions - only ADMIN and MANAGER can delete
    if (!["ADMIN", "MANAGER"].includes(request.auth.user.role)) {
      return errorResponse("Insufficient permissions", 403);
    }

    await prisma.driver.delete({
      where: { id },
    });

    return successResponse({ message: `Driver ${id} deleted successfully` });
  } catch (error) {
    console.error(`Error deleting driver ${id}:`, error);
    return errorResponse(`Error deleting driver ${id}`, 500);
  }
}

// Only ADMIN and MANAGER can update and delete drivers
export const PUT = protectedRoute(handleUpdateDriver, {
  roles: ["ADMIN", "MANAGER"],
});

export const DELETE = protectedRoute(handleDeleteDriver, {
  roles: ["ADMIN", "MANAGER"],
});
