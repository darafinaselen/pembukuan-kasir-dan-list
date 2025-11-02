/**
 * Get Current Session/User API Route
 * Returns current authenticated user info
 */

import { protectedRoute, successResponse } from "@/lib/middleware";

async function handleGetSession(request) {
  const { user, session } = request.auth;

  return successResponse(
    {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
      session: {
        expiresAt: session.expiresAt,
      },
    },
    "Session retrieved successfully"
  );
}

export const GET = protectedRoute(handleGetSession, {
  auditLog: false, // Don't log session checks
  rateLimit: { max: 500, window: 60000 }, // Higher limit for session checks
});
