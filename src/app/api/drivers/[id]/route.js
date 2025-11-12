import { prisma } from "@/lib/prisma";
import {
  protectedRoute,
  successResponse,
  errorResponse,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { logDriverEvent } from "@/lib/audit";

/**
 * GET /api/drivers/[id]
 * Get a specific driver by ID
 */
async function handleGetDriver(req, context) {
  try {
    const { id } = await context.params;

    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      return errorResponse("Sopir tidak ditemukan", 404);
    }

    return successResponse(driver, "Berhasil mendapatkan data sopir");
  } catch (error) {
    console.error("Error getting driver:", error);
    return errorResponse("Gagal mendapatkan data sopir", 500);
  }
}

/**
 * PUT /api/drivers/[id]
 * Update a driver
 */
async function handleUpdateDriver(req, context) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    // Validate required fields
    const { driver_name, phone_number } = body;

    if (!driver_name || !phone_number) {
      return errorResponse(
        "Field driver_name dan phone_number harus diisi",
        400
      );
    }

    // Validate phone number format
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(phone_number)) {
      return errorResponse("Format nomor telepon tidak valid", 400);
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      return errorResponse("Sopir tidak ditemukan", 404);
    }

    // Update the driver
    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        driver_name,
        phone_number,
        status: body.status || "AVAILABLE",
      },
    });

    // Log audit event
    await logDriverEvent(
      req.auth.user.id,
      "UPDATE",
      id,
      { before: existingDriver, after: updatedDriver },
      getClientIp(req),
      getUserAgent(req)
    );

    return successResponse(updatedDriver, "Sopir berhasil diperbarui");
  } catch (error) {
    console.error("Error updating driver:", error);
    return errorResponse("Gagal memperbarui sopir", 500);
  }
}

/**
 * DELETE /api/drivers/[id]
 * Delete a driver
 */
async function handleDeleteDriver(req, context) {
  try {
    const { id } = await context.params;

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      return errorResponse("Sopir tidak ditemukan", 404);
    }

    // Check if driver is assigned to any transactions
    const transactionCount = await prisma.transaction.count({
      where: { driver_id: id },
    });

    if (transactionCount > 0) {
      return errorResponse(
        `Sopir tidak dapat dihapus karena masih digunakan di ${transactionCount} transaksi`,
        400
      );
    }

    // Delete the driver
    await prisma.driver.delete({
      where: { id },
    });

    // Log audit event
    await logDriverEvent(
      req.auth.user.id,
      "DELETE",
      id,
      existingDriver,
      getClientIp(req),
      getUserAgent(req)
    );

    return successResponse(null, "Sopir berhasil dihapus");
  } catch (error) {
    console.error("Error deleting driver:", error);
    return errorResponse("Gagal menghapus sopir", 500);
  }
}

// Export with protected route middleware
export const GET = protectedRoute(handleGetDriver, {
  requiredPermissions: ["view_drivers"],
});

export const PUT = protectedRoute(handleUpdateDriver, {
  requiredPermissions: ["edit_drivers"],
});

export const DELETE = protectedRoute(handleDeleteDriver, {
  requiredPermissions: ["delete_drivers"],
});
