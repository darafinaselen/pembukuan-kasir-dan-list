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

const userUpdateSchema = z.object({
  email: z.string().email("Email tidak valid").optional(),
  username: z.string().min(3, "Username minimal 3 karakter").optional(),
  name: z.string().min(1, "Nama tidak boleh kosong").optional(),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users/[id] - Get single user
async function handler(req, { params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  console.log("🔍 User API [id] - Method:", req.method, "ID:", id);

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
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
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "User tidak ditemukan",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: user,
        message: "User retrieved successfully",
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch user",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  // PUT /api/users/[id] - Update user
  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const validatedData = userUpdateSchema.parse(body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "User tidak ditemukan",
          },
          { status: 404 }
        );
      }

      // Check if email is being changed and already exists
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: validatedData.email },
        });

        if (emailExists) {
          return NextResponse.json(
            {
              success: false,
              message: "Email sudah terdaftar",
            },
            { status: 400 }
          );
        }
      }

      // Check if username is being changed and already exists
      if (
        validatedData.username &&
        validatedData.username !== existingUser.username
      ) {
        const usernameExists = await prisma.user.findUnique({
          where: { username: validatedData.username },
        });

        if (usernameExists) {
          return NextResponse.json(
            {
              success: false,
              message: "Username sudah digunakan",
            },
            { status: 400 }
          );
        }
      }

      // Prepare update data
      const updateData = {};

      if (validatedData.email) updateData.email = validatedData.email;
      if (validatedData.username) updateData.username = validatedData.username;
      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.role) updateData.role = validatedData.role;
      if (typeof validatedData.isActive === "boolean")
        updateData.isActive = validatedData.isActive;

      // Hash password if provided
      if (validatedData.password) {
        updateData.password = await bcrypt.hash(validatedData.password, 12);
      }

      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
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
      });

      // Log audit event
      await logUserEvent(
        req.auth.user.id,
        "UPDATE",
        id,
        { before: existingUser, after: user },
        getClientIp(req),
        getUserAgent(req)
      );

      return NextResponse.json({
        success: true,
        data: user,
        message: "User berhasil diupdate",
      });
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

      console.error("Error updating user:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengupdate user",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  // DELETE /api/users/[id] - Delete user
  if (req.method === "DELETE") {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "User tidak ditemukan",
          },
          { status: 404 }
        );
      }

      // Prevent deleting yourself (optional safety check)
      // You would need to get current user from session
      // For now, we'll allow deletion

      await prisma.user.delete({
        where: { id },
      });

      // Log audit event
      await logUserEvent(
        req.auth.user.id,
        "DELETE",
        id,
        { username: existingUser.username, name: existingUser.name },
        getClientIp(req),
        getUserAgent(req)
      );

      return NextResponse.json({
        success: true,
        message: "User berhasil dihapus",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal menghapus user",
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

export const PUT = protectedRoute(handler, {
  rateLimit: rateLimitPresets.write,
  requiredRole: "ADMIN",
});

export const DELETE = protectedRoute(handler, {
  rateLimit: rateLimitPresets.write,
  requiredRole: "ADMIN",
});
