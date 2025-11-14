import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { protectedRoute, getClientIp, getUserAgent, errorResponse, permissions } from "@/lib/middleware";
import { logStaffEvent } from "@/lib/audit";

/**
 * GET /api/staff
 * Mengambil daftar staff dengan filter dan pagination
 *
 * Query Parameters:
 * - status: Filter berdasarkan status (ACTIVE, INACTIVE, ON_LEAVE, TERMINATED)
 * - search: Pencarian berdasarkan nama, NIK, posisi, atau phone
 * - page: Halaman (default: 1)
 * - limit: Jumlah per halaman (default: 10)
 */
async function handleGetStaff(request) {
  try {
    // Check permissions - both ADMIN and OPERATOR can view staff
    if (!permissions.canViewStaff(request.auth.user)) {
      return errorResponse("Insufficient permissions to view staff", 403);
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { staff_name: { contains: search, mode: "insensitive" } },
        { nik: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
        { phone_number: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.staff.count({ where });

    // Get staff list
    const staff = await prisma.staff.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      staff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data staff" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff
 * Membuat staff baru
 *
 * Request Body:
 * {
 *   staff_name: string (required),
 *   nik: string (optional),
 *   position: string (required, free text),
 *   phone_number: string (required),
 *   email: string (optional),
 *   address: string (optional),
 *   salary_amount: number (required),
 *   allowances: number (optional),
 *   bank_name: string (optional),
 *   bank_account: string (optional),
 *   account_holder: string (optional),
 *   join_date: string (required, ISO date),
 *   status: StaffStatus (optional, default: ACTIVE),
 *   notes: string (optional)
 * }
 */
async function handleCreateStaff(request) {
  try {
    // Check permissions - only ADMIN can create staff
    if (!permissions.canManageStaff(request.auth.user)) {
      return errorResponse("Insufficient permissions to manage staff", 403);
    }

    const body = await request.json();

    // Validasi field required
    const requiredFields = [
      "staff_name",
      "position",
      "phone_number",
      "salary_amount",
      "join_date",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Field ${field} wajib diisi` },
          { status: 400 }
        );
      }
    }

    // Validasi position tidak boleh kosong
    if (!body.position.trim()) {
      return NextResponse.json(
        { error: "Posisi tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Validasi status
    if (body.status) {
      const validStatuses = ["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Status tidak valid" },
          { status: 400 }
        );
      }
    }

    // Validasi salary harus positif
    if (body.salary_amount <= 0) {
      return NextResponse.json(
        { error: "Gaji harus lebih dari 0" },
        { status: 400 }
      );
    }

    // Validasi allowances (jika ada) harus tidak negatif
    if (body.allowances !== undefined && body.allowances < 0) {
      return NextResponse.json(
        { error: "Tunjangan tidak boleh negatif" },
        { status: 400 }
      );
    }

    // Validasi NIK unique (jika diisi)
    if (body.nik) {
      const existingStaff = await prisma.staff.findUnique({
        where: { nik: body.nik },
      });
      if (existingStaff) {
        return NextResponse.json(
          { error: "NIK sudah terdaftar" },
          { status: 400 }
        );
      }
    }

    // Validasi format tanggal
    const joinDate = new Date(body.join_date);
    if (isNaN(joinDate.getTime())) {
      return NextResponse.json(
        { error: "Format tanggal bergabung tidak valid" },
        { status: 400 }
      );
    }

    // Buat staff baru
    const staff = await prisma.staff.create({
      data: {
        staff_name: body.staff_name,
        nik: body.nik || null,
        position: body.position,
        phone_number: body.phone_number,
        email: body.email || null,
        address: body.address || null,
        salary_amount: body.salary_amount,
        allowances: body.allowances || 0,
        bank_name: body.bank_name || null,
        bank_account: body.bank_account || null,
        account_holder: body.account_holder || null,
        join_date: joinDate,
        status: body.status || "ACTIVE",
        notes: body.notes || null,
      },
    });

    // Log audit event
    await logStaffEvent(
      request.auth.user.id,
      "CREATE",
      staff.id,
      { staff_name: staff.staff_name, position: staff.position },
      getClientIp(request),
      getUserAgent(request)
    );

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: "Gagal membuat staff baru" },
      { status: 500 }
    );
  }
}

// Export with protected route middleware
export const GET = protectedRoute(handleGetStaff, {
  roles: ["ADMIN", "OPERATOR"],
});

export const POST = protectedRoute(handleCreateStaff, {
  roles: ["ADMIN"],
});
