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
    const { user, session } = request.auth;
    const token = getTokenFromRequest(request);

    // Check if session is already expired
    const now = new Date();
    const isExpired = session.expiresAt < now;

    // Delete session (will succeed even if already expired)
    await deleteSession(token);

    // Log logout with appropriate success status
    await logAuthEvent(
      user.id,
      "LOGOUT",
      request.auth.ipAddress,
      request.auth.userAgent,
      true // Always log as successful logout
    );

    // Create response with appropriate message
    const responseMessage = isExpired
      ? "Session was expired and has been cleared"
      : "Logout successful";

    const response = NextResponse.json({
      success: true,
      message: responseMessage,
      data: {
        wasExpired: isExpired,
        loggedOutAt: new Date().toISOString(),
      },
    });

    // Clear all possible session cookies
    const cookieNames = ['session', 'session_admin', 'session_operator'];
    for (const cookieName of cookieNames) {
      response.cookies.set(cookieName, "", {
        httpOnly: true,
        secure: false, // Allow clearing on HTTP
        sameSite: "lax",
        maxAge: 0, // Expire immediately
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    // Even if there's an error, try to clear cookies
    try {
      const errorResponse = NextResponse.json({
        success: false,
        message: "Logout completed with warnings",
        data: null,
      }, { status: 200 });

      // Clear cookies anyway
      const cookieNames = ['session', 'session_admin', 'session_operator'];
      for (const cookieName of cookieNames) {
        errorResponse.cookies.set(cookieName, "", {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 0,
          path: "/",
        });
      }

      return errorResponse;
    } catch (cookieError) {
      // If even cookie clearing fails, return basic error
      return NextResponse.json({
        success: false,
        message: "An error occurred during logout",
      }, { status: 500 });
    }
  }
}

export const POST = protectedRoute(handleLogout, {
  auditLog: false, // Already logging in handler
});
