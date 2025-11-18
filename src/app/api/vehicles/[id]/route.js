import { prisma } from "@/lib/prisma";
import {
  protectedRoute,
  successResponse,
  errorResponse,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { logArmadaEvent } from "@/lib/audit";

/**
 * GET /api/vehicles/[id]
 * Get a specific vehicle by ID
 */
async function handleGetVehicle(req, context) {
  try {
    const { id } = await context.params;

    const vehicle = await prisma.armada.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return errorResponse("Kendaraan tidak ditemukan", 404);
    }

    return successResponse(vehicle, "Berhasil mendapatkan data kendaraan");
  } catch (error) {
    console.error("Error getting vehicle:", error);
    return errorResponse("Gagal mendapatkan data kendaraan", 500);
  }
}

/**
 * PUT /api/vehicles/[id]
 * Update a vehicle
 */
async function handleUpdateVehicle(req, context) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    // Validate required fields
    const { license_plate, brand, model } = body;

    if (!license_plate || !brand || !model) {
      return errorResponse(
        "Field license_plate, brand, dan model harus diisi",
        400
      );
    }

    // Validate license plate format (basic Indonesian format)
    const plateRegex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/i;
    if (!plateRegex.test(license_plate)) {
      return errorResponse(
        "Format plat nomor tidak valid (contoh: B 1234 XYZ)",
        400
      );
    }

    // Check if vehicle exists
    const existingVehicle = await prisma.armada.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      return errorResponse("Kendaraan tidak ditemukan", 404);
    }

    // Check if license plate is already used by another vehicle
    const duplicatePlate = await prisma.armada.findFirst({
      where: {
        license_plate,
        id: { not: id }, // Exclude current vehicle
      },
    });

    if (duplicatePlate) {
      return errorResponse(
        "Plat nomor sudah digunakan oleh kendaraan lain",
        400
      );
    }

    // Update the vehicle
    const updatedVehicle = await prisma.armada.update({
      where: { id },
      data: {
        license_plate: license_plate.toUpperCase(),
        brand,
        model,
        vehicle_type: body.vehicle_type || null,
        year: body.year || null,
        color: body.color || null,
        capacity: body.capacity || null,
        status: body.status || "READY",
      },
    });

    // Log audit event
    await logArmadaEvent(
      req.auth.user.id,
      "UPDATE",
      id,
      { before: existingVehicle, after: updatedVehicle },
      getClientIp(req),
      getUserAgent(req)
    );

    return successResponse(updatedVehicle, "Kendaraan berhasil diperbarui");
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return errorResponse("Gagal memperbarui kendaraan", 500);
  }
}

/**
 * DELETE /api/vehicles/[id]
 * Delete a vehicle
 */
async function handleDeleteVehicle(req, context) {
  try {
    const { id } = await context.params;

    // Check if vehicle exists
    const existingVehicle = await prisma.armada.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      return errorResponse("Kendaraan tidak ditemukan", 404);
    }

    // Check if vehicle is assigned to any transactions
    const transactionCount = await prisma.transaction.count({
      where: { armadaId: id },
    });

    if (transactionCount > 0) {
      return errorResponse(
        `Kendaraan tidak dapat dihapus karena masih digunakan di ${transactionCount} transaksi`,
        400
      );
    }

    // Delete the vehicle
    await prisma.armada.delete({
      where: { id },
    });

    // Log audit event
    await logArmadaEvent(
      req.auth.user.id,
      "DELETE",
      id,
      existingVehicle,
      getClientIp(req),
      getUserAgent(req)
    );

    return successResponse(null, "Kendaraan berhasil dihapus");
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return errorResponse("Gagal menghapus kendaraan", 500);
  }
}

// Export with protected route middleware
export const GET = protectedRoute(handleGetVehicle, {
  requiredPermissions: ["view_armada"],
});

export const PUT = protectedRoute(handleUpdateVehicle, {
  requiredPermissions: ["edit_armada"],
});

export const DELETE = protectedRoute(handleDeleteVehicle, {
  requiredPermissions: ["delete_armada"],
});
