/**
 * Logout API Route
 * Terminates user session
 */

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

    return successResponse(null, "Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("An error occurred during logout", 500);
  }
}

export const POST = protectedRoute(handleLogout, {
  auditLog: false, // Already logging in handler
});
