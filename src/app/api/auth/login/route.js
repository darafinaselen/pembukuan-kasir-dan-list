/**
 * Login API Route
 * Authenticates user and creates session
 */

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

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
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

    const { username, password } = validation.data;

    // Get client info
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
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

    // Return session token and user info
    return successResponse(
      {
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
      "Login successful"
    );
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("An error occurred during login", 500);
  }
}

export const POST = publicRoute(handleLogin, {
  rateLimit: { max: 10, window: 60000 }, // 10 attempts per minute per IP
});
