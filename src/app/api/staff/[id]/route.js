import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { protectedRoute, getClientIp, getUserAgent } from "@/lib/middleware";
import { logStaffEvent } from "@/lib/audit";

/**
 * GET /api/staff/[id]
 * Mengambil detail staff berdasarkan ID
 */
async function handleGetStaff(request, context) {
  try {
    const { id } = await context.params;

    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data staff" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/staff/[id]
 * Mengupdate data staff
 *
 * Request Body: (semua field optional)
 * {
 *   staff_name: string,
 *   nik: string,
 *   position: string (free text),
 *   phone_number: string,
 *   email: string,
 *   address: string,
 *   salary_amount: number,
 *   allowances: number,
 *   bank_name: string,
 *   bank_account: string,
 *   account_holder: string,
 *   status: StaffStatus,
 *   resign_date: string (ISO date),
 *   notes: string
 * }
 */
async function handleUpdateStaff(request, context) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { error: "Staff tidak ditemukan" },
        { status: 404 }
      );
    }

    // Validasi posisi (jika diubah) - harus tidak kosong
    if (body.position !== undefined) {
      if (!body.position || !body.position.trim()) {
        return NextResponse.json(
          { error: "Posisi tidak boleh kosong" },
          { status: 400 }
        );
      }
    }

    // Validasi status (jika diubah)
    if (body.status) {
      const validStatuses = ["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Status tidak valid" },
          { status: 400 }
        );
      }
    }

    // Validasi salary (jika diubah)
    if (body.salary_amount !== undefined && body.salary_amount <= 0) {
      return NextResponse.json(
        { error: "Gaji harus lebih dari 0" },
        { status: 400 }
      );
    }

    // Validasi allowances (jika diubah)
    if (body.allowances !== undefined && body.allowances < 0) {
      return NextResponse.json(
        { error: "Tunjangan tidak boleh negatif" },
        { status: 400 }
      );
    }

    // Validasi NIK unique (jika diubah)
    if (body.nik && body.nik !== existingStaff.nik) {
      const duplicateStaff = await prisma.staff.findUnique({
        where: { nik: body.nik },
      });
      if (duplicateStaff) {
        return NextResponse.json(
          { error: "NIK sudah terdaftar" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData = {};

    const allowedFields = [
      "staff_name",
      "nik",
      "position",
      "phone_number",
      "email",
      "address",
      "salary_amount",
      "allowances",
      "bank_name",
      "bank_account",
      "account_holder",
      "status",
      "notes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle resign_date specially
    if (body.resign_date !== undefined) {
      if (body.resign_date === null) {
        updateData.resign_date = null;
      } else {
        const resignDate = new Date(body.resign_date);
        if (isNaN(resignDate.getTime())) {
          return NextResponse.json(
            { error: "Format tanggal resign tidak valid" },
            { status: 400 }
          );
        }
        updateData.resign_date = resignDate;
      }
    }

    // Update staff
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: updateData,
    });

    // Log audit event
    await logStaffEvent(
      request.auth.user.id,
      "UPDATE",
      id,
      { before: existingStaff, after: updatedStaff },
      getClientIp(request),
      getUserAgent(request)
    );

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate staff" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/[id]
 * Menghapus staff (soft delete dengan mengubah status menjadi TERMINATED)
 */
async function handleDeleteStaff(request, context) {
  try {
    const { id } = await context.params;

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { error: "Staff tidak ditemukan" },
        { status: 404 }
      );
    }

    // Soft delete: update status to TERMINATED
    const deletedStaff = await prisma.staff.update({
      where: { id },
      data: {
        status: "TERMINATED",
        resign_date: new Date(),
      },
    });

    // Log audit event
    await logStaffEvent(
      request.auth.user.id,
      "DELETE",
      id,
      {
        staff_name: existingStaff.staff_name,
        position: existingStaff.position,
      },
      getClientIp(request),
      getUserAgent(request)
    );

    return NextResponse.json({
      message: "Staff berhasil dihapus",
      staff: deletedStaff,
    });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: "Gagal menghapus staff" },
      { status: 500 }
    );
  }
}

// Export with protected route middleware
export const GET = protectedRoute(handleGetStaff, {
  requiredPermissions: ["view_staff"],
});

export const PUT = protectedRoute(handleUpdateStaff, {
  requiredPermissions: ["edit_staff"],
});

export const DELETE = protectedRoute(handleDeleteStaff, {
  requiredPermissions: ["delete_staff"],
});
