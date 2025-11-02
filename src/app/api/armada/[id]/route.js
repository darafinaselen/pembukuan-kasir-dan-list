import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

async function handleUpdateArmada(request, { params }) {
  const { id } = await params;

  try {
    // Check permissions - only ADMIN and MANAGER can update
    if (!["ADMIN", "MANAGER"].includes(request.auth.user.role)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const data = await request.json();
    const { license_plate, brand, model, status } = data;

    const updatedArmada = await prisma.armada.update({
      where: { id },
      data: {
        license_plate,
        brand,
        model,
        status,
      },
    });

    return successResponse(updatedArmada);
  } catch (error) {
    console.error(`Error updating armada ${id}:`, error);
    return errorResponse(`Error updating armada ${id}`, 500);
  }
}

async function handleDeleteArmada(request, { params }) {
  const { id } = await params;

  try {
    // Check permissions - only ADMIN and MANAGER can delete
    if (!["ADMIN", "MANAGER"].includes(request.auth.user.role)) {
      return errorResponse("Insufficient permissions", 403);
    }

    await prisma.armada.delete({
      where: { id },
    });

    return successResponse({ message: `Armada ${id} deleted successfully` });
  } catch (error) {
    console.error(`Error deleting armada ${id}:`, error);
    return errorResponse(`Error deleting armada ${id}`, 500);
  }
}

// Only ADMIN and MANAGER can update and delete armadas
export const PUT = protectedRoute(handleUpdateArmada, {
  roles: ["ADMIN", "MANAGER"],
});

export const DELETE = protectedRoute(handleDeleteArmada, {
  roles: ["ADMIN", "MANAGER"],
});
