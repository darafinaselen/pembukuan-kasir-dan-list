/**
 * Session Refresh API Route
 * Extends session expiry for active users
 */

import { NextResponse } from "next/server";
import { protectedRoute, successResponse, errorResponse } from "@/lib/middleware";
import { refreshSession } from "@/lib/auth";

async function handleRefresh(request) {
  try {
    const token = request.auth.session.token;

    // Refresh the session
    const refreshedSession = await refreshSession(token);

    if (!refreshedSession) {
      return errorResponse("Unable to refresh session", 401);
    }

    return successResponse({
      message: "Session refreshed successfully",
      expiresAt: refreshedSession.expiresAt,
    });
  } catch (error) {
    console.error("Session refresh error:", error);
    return errorResponse("An error occurred during session refresh", 500);
  }
}

export const POST = protectedRoute(handleRefresh, {
  auditLog: false, // Don't log session refresh as it's frequent
});