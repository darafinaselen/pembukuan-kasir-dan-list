import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectedRoute,
  rateLimitPresets,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logUserEvent } from "@/lib/audit";

// Schema validation
const userCreateSchema = z.object({
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter"),
  name: z.string().min(1, "Nama tidak boleh kosong"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]),
});

const userUpdateSchema = z.object({
  email: z.string().email("Email tidak valid").optional(),
  username: z.string().min(3, "Username minimal 3 karakter").optional(),
  name: z.string().min(1, "Nama tidak boleh kosong").optional(),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users - Get all users
async function handler(req) {
  if (req.method === "GET") {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          lastLoginIp: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        success: true,
        data: users,
        message: "Users retrieved successfully",
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch users",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  // POST /api/users - Create new user
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const validatedData = userCreateSchema.parse(body);

      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message: "Email sudah terdaftar",
          },
          { status: 400 }
        );
      }

      // Check if username already exists
      const existingUsername = await prisma.user.findUnique({
        where: { username: validatedData.username },
      });

      if (existingUsername) {
        return NextResponse.json(
          {
            success: false,
            message: "Username sudah digunakan",
          },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: validatedData.email,
          username: validatedData.username,
          name: validatedData.name,
          password: hashedPassword,
          role: validatedData.role,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log audit event
      await logUserEvent(
        req.auth.user.id,
        "CREATE",
        user.id,
        { username: user.username, name: user.name, role: user.role },
        getClientIp(req),
        getUserAgent(req)
      );

      return NextResponse.json(
        {
          success: true,
          data: user,
          message: "User berhasil dibuat",
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            message: "Validasi gagal",
            errors: error.errors,
          },
          { status: 400 }
        );
      }

      console.error("Error creating user:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal membuat user",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}

export const GET = protectedRoute(handler, {
  rateLimit: rateLimitPresets.read,
  requiredRole: "ADMIN",
});

export const POST = protectedRoute(handler, {
  rateLimit: rateLimitPresets.write,
  requiredRole: "ADMIN",
});
