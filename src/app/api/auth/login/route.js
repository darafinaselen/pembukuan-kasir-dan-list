/**
 * Login API Route
 * Authenticates user and creates session
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  publicRoute,
  errorResponse,
  successResponse,
  validateBody,
  getClientIp,
  getUserAgent,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSession,
  isAccountLocked,
  recordFailedLogin,
  resetFailedLoginAttempts,
  updateLastLogin,
} from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

// Validation schema - accepts either email or username
const loginSchema = z
  .object({
    email: z.string().min(1, "Email or username is required").optional(),
    username: z.string().min(1, "Email or username is required").optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username is required",
    path: ["email"],
  });

async function handleLogin(request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validateBody(body, loginSchema);
    if (validation.error) {
      return errorResponse("Validation failed", 400, validation.error);
    }

    const { email, username, password } = validation.data;
    const loginIdentifier = email || username;

    // Get client info
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: loginIdentifier }, { email: loginIdentifier }],
      },
    });

    // Check if user exists
    if (!user) {
      // Log failed attempt (no user found)
      await logAuthEvent(null, "LOGIN", ipAddress, userAgent, false);

      return errorResponse("Invalid username or password", 401);
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      await logAuthEvent(user.id, "LOGIN", ipAddress, userAgent, false);

      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return errorResponse(
        `Account is locked due to too many failed login attempts. Try again in ${minutesLeft} minutes.`,
        403
      );
    }

    // Check if account is active
    if (!user.isActive) {
      await logAuthEvent(user.id, "LOGIN", ipAddress, userAgent, false);

      return errorResponse("Account is deactivated", 403);
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      // Record failed login attempt
      const isLocked = await recordFailedLogin(user.id);

      await logAuthEvent(user.id, "LOGIN", ipAddress, userAgent, false);

      if (isLocked) {
        return errorResponse(
          "Too many failed login attempts. Account has been locked for 30 minutes.",
          403
        );
      }

      const attemptsLeft = 5 - user.failedLoginAttempts - 1;
      return errorResponse(
        `Invalid username or password. ${attemptsLeft} attempts remaining.`,
        401
      );
    }

    // Reset failed login attempts
    await resetFailedLoginAttempts(user.id);

    // Update last login info
    await updateLastLogin(user.id, ipAddress);

    // Create session
    const session = await createSession(user.id, ipAddress, userAgent);

    // Log successful login
    await logAuthEvent(user.id, "LOGIN", ipAddress, userAgent, true);

    // Prepare response data
    const responseData = {
      success: true,
      message: "Login successful",
      data: {
        token: session.token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        expiresAt: session.expiresAt,
      },
      timestamp: new Date().toISOString(),
    };

    // Create NextResponse with cookie
    const response = NextResponse.json(responseData, { status: 200 });

    // Set session cookie (httpOnly, secure only if HTTPS)
    const isProduction = process.env.NODE_ENV === "production";
    const isHttps = process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://");

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction && isHttps, // Only secure if production AND using HTTPS
      sameSite: isProduction ? "lax" : "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    };

    // Use different cookie names for different roles to allow multiple sessions
    const cookieName = `session_${user.role.toLowerCase()}`;
    response.cookies.set(cookieName, session.token, cookieOptions);

    // Also set a general "session" cookie for backward compatibility
    response.cookies.set("session", session.token, cookieOptions);

    // Debug log
    console.log("🍪 Setting cookie:", {
      name: "session",
      value: session.token.substring(0, 20) + "...",
      options: cookieOptions,
      isProduction,
      isHttps,
      url: process.env.NEXT_PUBLIC_BASE_URL || "not set",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("An error occurred during login", 500);
  }
}

export const POST = publicRoute(handleLogin, {
  rateLimit: { max: 10, window: 60000 }, // 10 attempts per minute per IP
});
