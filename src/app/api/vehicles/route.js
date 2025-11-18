import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { logArmadaEvent } from "@/lib/audit";

async function handleGetArmadas(request) {
  try {
    // All roles can view armadas
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const whereClause = statusFilter ? { status: statusFilter } : {};

    const armadas = await prisma.armada.findMany({
      where: whereClause,
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
    // Check permissions - only ADMIN can create
    if (!["ADMIN"].includes(request.auth.user.role)) {
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

    // Log audit event
    await logArmadaEvent(
      request.auth.user.id,
      "CREATE",
      newArmada.id,
      newArmada,
      getClientIp(request),
      getUserAgent(request)
    );

    return successResponse(newArmada, 201);
  } catch (error) {
    console.error("Error creating armada:", error);
    return errorResponse("Error creating armada", 500);
  }
}

// ADMIN and OPERATOR can view armadas (OPERATOR needs to select for transactions)
export const GET = protectedRoute(handleGetArmadas, {
  roles: ["ADMIN", "OPERATOR"],
});

// Only ADMIN can create armadas
export const POST = protectedRoute(handleCreateArmada, {
  roles: ["ADMIN"],
});
