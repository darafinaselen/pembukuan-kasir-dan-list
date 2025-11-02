import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

async function handleGetArmadas(request) {
  try {
    // All roles can view armadas
    const armadas = await prisma.armada.findMany({
      orderBy: { createdAt: "desc" },
    });
    return successResponse(armadas);
  } catch (error) {
    console.error("Error fetching armadas:", error);
    return errorResponse("Error fetching armadas", 500);
  }
}

async function handleCreateArmada(request) {
  try {
    // Check permissions - only ADMIN and MANAGER can create
    if (!["ADMIN", "MANAGER"].includes(request.auth.user.role)) {
      return errorResponse("Insufficient permissions", 403);
    }

    const data = await request.json();
    const { license_plate, brand, model, status } = data;

    if (!license_plate || !brand || !model) {
      return errorResponse("Missing required fields", 400);
    }

    const newArmada = await prisma.armada.create({
      data: {
        license_plate,
        brand,
        model,
        status,
      },
    });

    return successResponse(newArmada, 201);
  } catch (error) {
    console.error("Error creating armada:", error);
    return errorResponse("Error creating armada", 500);
  }
}

// All roles can view armadas
export const GET = protectedRoute(handleGetArmadas, {
  roles: ["ADMIN", "MANAGER", "OPERATOR"],
});

// Only ADMIN and MANAGER can create armadas
export const POST = protectedRoute(handleCreateArmada, {
  roles: ["ADMIN", "MANAGER"],
});
