/**
 * Register User API Route (Admin only)
 * Creates new user account
 */

import { z } from "zod";
import {
  protectedRoute,
  errorResponse,
  successResponse,
  validateBody,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// Validation schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]).default("OPERATOR"),
});

async function handleRegister(request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validateBody(body, registerSchema);
    if (validation.error) {
      return errorResponse("Validation failed", 400, validation.error);
    }

    const { username, email, password, name, role } = validation.data;

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return errorResponse("Username already exists", 409);
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return errorResponse("Email already exists", 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Log user creation
    await createAuditLog({
      userId: request.auth.user.id,
      action: "CREATE",
      resource: "User",
      resourceId: user.id,
      description: `Created new user: ${user.username} (${user.role})`,
      metadata: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
      ipAddress: request.auth.ipAddress,
      userAgent: request.auth.userAgent,
    });

    return successResponse(user, "User created successfully");
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("An error occurred during registration", 500);
  }
}

export const POST = protectedRoute(handleRegister, {
  roles: ["ADMIN"], // Only admins can create users
});
