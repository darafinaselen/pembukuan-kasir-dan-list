/**
 * Logout API Route
 * Terminates user session
 */

import { NextResponse } from "next/server";
import {
  protectedRoute,
  successResponse,
  errorResponse,
  getTokenFromRequest,
} from "@/lib/middleware";
import { deleteSession } from "@/lib/auth";
import { logAuthEvent } from "@/lib/audit";

async function handleLogout(request) {
  try {
    const { user } = request.auth;
    const token = getTokenFromRequest(request);

    // Delete session
    await deleteSession(token);

    // Log logout
    await logAuthEvent(
      user.id,
      "LOGOUT",
      request.auth.ipAddress,
      request.auth.userAgent,
      true
    );

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
      data: null,
    });

    // Clear session cookie
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: false, // Allow clearing on HTTP
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("An error occurred during logout", 500);
  }
}

export const POST = protectedRoute(handleLogout, {
  auditLog: false, // Already logging in handler
});
