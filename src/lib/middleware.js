/**
 * API Middleware
 * Authentication, authorization, rate limiting, and validation
 */

import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { createAuditLog } from "./audit";

/**
 * Get client IP address from request
 */
export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Get user agent from request
 */
export function getUserAgent(request) {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Extract session token from request
 */
export function getTokenFromRequest(request) {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try cookie
  const cookies = request.headers.get("cookie");
  if (cookies) {
    const match = cookies.match(/session=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Authentication middleware
 * Validates session token and attaches user to request
 */
export async function requireAuth(request) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return {
      error: "Unauthorized - No token provided",
      status: 401,
    };
  }

  const session = await getSession(token);

  if (!session) {
    return {
      error: "Unauthorized - Invalid or expired token",
      status: 401,
    };
  }

  // Attach session and user to request context
  return {
    session,
    user: session.user,
  };
}

/**
 * Role-based authorization middleware
 * @param {array} allowedRoles - Array of allowed roles (e.g., ['ADMIN', 'MANAGER'])
 */
export function requireRole(user, allowedRoles) {
  if (!user) {
    return {
      error: "Unauthorized - Authentication required",
      status: 401,
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      error: `Forbidden - Requires one of: ${allowedRoles.join(", ")}`,
      status: 403,
    };
  }

  return null;
}

/**
 * Permission helper functions
 */
export const permissions = {
  // Transaction permissions
  // OPERATOR can view and create transactions (as DRAFT), but must submit for approval
  canViewTransactions: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  canCreateTransaction: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  // OPERATOR can update DRAFT transactions, ADMIN can update any
  canUpdateTransaction: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  canDeleteTransaction: (user) => ["ADMIN"].includes(user?.role),

  // Financial report permissions
  // OPERATOR cannot view financial reports (keuangan)
  canViewReports: (user) => ["ADMIN"].includes(user?.role),
  canExportReports: (user) => ["ADMIN"].includes(user?.role),

  // Expense permissions
  // OPERATOR can view and create expenses (as DRAFT), but must submit for approval
  canViewExpenses: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  canCreateExpense: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  // Only ADMIN can update/delete/approve/reject expenses
  canUpdateExpense: (user) => ["ADMIN"].includes(user?.role),
  canDeleteExpense: (user) => ["ADMIN"].includes(user?.role),

  // Fleet (Armada) permissions
  // OPERATOR can view fleet to select for transactions
  canViewFleet: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  // Only ADMIN can manage (create/update/delete) fleet
  canManageFleet: (user) => ["ADMIN"].includes(user?.role),

  // Driver permissions
  // OPERATOR can view drivers to select for transactions
  canViewDrivers: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  // Only ADMIN can manage (create/update/delete) drivers
  canManageDrivers: (user) => ["ADMIN"].includes(user?.role),

  // Package permissions
  // OPERATOR can view packages to select for transactions
  canViewPackages: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  // Only ADMIN can manage (create/update/delete) packages
  canManagePackages: (user) => ["ADMIN"].includes(user?.role),

  // User management permissions
  canViewUsers: (user) => ["ADMIN"].includes(user?.role),
  canManageUsers: (user) => ["ADMIN"].includes(user?.role),

  // Audit log permissions
  canViewAuditLogs: (user) => ["ADMIN"].includes(user?.role),

  // Dashboard permissions
  // OPERATOR cannot view dashboard (contains financial data)
  canViewDashboard: (user) => ["ADMIN"].includes(user?.role),
};

/**
 * Rate limiting using in-memory store (for simple cases)
 * For production, use Redis or similar
 */
const rateLimitStore = new Map();

/**
 * Rate limit configuration presets
 */
export const rateLimitPresets = {
  // Very strict - for authentication endpoints
  auth: { max: 5, window: 60000 }, // 5 requests per minute

  // Strict - for write operations (POST, PUT, DELETE)
  write: { max: 100, window: 60000 }, // 100 requests per minute

  // Moderate - for read operations (GET)
  read: { max: 600, window: 60000 }, // 600 requests per minute (10/sec)

  // Lenient - for high-frequency operations
  realtime: { max: 1000, window: 60000 }, // 1000 requests per minute

  // Custom for specific endpoints
  reports: { max: 600, window: 60000 }, // 600 requests per minute for reports
  export: { max: 20, window: 300000 }, // 20 requests per 5 minutes
  bulk: { max: 10, window: 60000 }, // 10 requests per minute
};

export function rateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const key = identifier;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
      firstRequest: now,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  const record = rateLimitStore.get(key);

  // Reset if window has passed
  if (now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
      firstRequest: now,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  // Check if limit exceeded
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Advanced rate limiting with IP-based and user-based tracking
 */
export function advancedRateLimit(request, config = rateLimitPresets.read) {
  const ipAddress = getClientIp(request);
  const user = request.auth?.user;

  // Create identifier: prefer user ID, fallback to IP
  const identifier = user?.id
    ? `user:${user.id}:${request.method}`
    : `ip:${ipAddress}:${request.method}`;

  return rateLimit(identifier, config.max, config.window);
}

/**
 * Clean up rate limit store periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * CORS headers for API responses
 */
export function getCorsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true", // Allow cookies
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handle OPTIONS preflight request
 */
export function handleOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

/**
 * Validate request body against schema
 * @param {object} data - Request body data
 * @param {object} schema - Zod schema
 */
export function validateBody(data, schema) {
  try {
    return {
      data: schema.parse(data),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error.errors || error.message,
    };
  }
}

/**
 * Standard API response wrapper
 */
export function apiResponse(data, status = 200, headers = {}) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...getCorsHeaders(),
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Error response helper
 */
export function errorResponse(message, status = 400, details = null) {
  return apiResponse(
    {
      error: message,
      details,
      timestamp: new Date().toISOString(),
    },
    status
  );
}

/**
 * Success response helper
 */
export function successResponse(data, message = "Success", meta = {}) {
  return apiResponse({
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Wrapper for protected API routes
 * Handles auth, rate limiting, and error handling
 */
export function protectedRoute(handler, options = {}) {
  const {
    roles = null, // Array of allowed roles
    rateLimit: rateLimitConfig = null, // Rate limit config or null to use method-based defaults
    auditLog = true,
    method = null, // Specify method for method-specific rate limits
  } = options;

  return async (request, context) => {
    try {
      // Handle OPTIONS preflight
      if (request.method === "OPTIONS") {
        return handleOptions();
      }

      // Get client info
      const ipAddress = getClientIp(request);
      const userAgent = getUserAgent(request);

      // Determine rate limit config based on HTTP method if not explicitly set
      let effectiveRateLimit = rateLimitConfig;
      if (!effectiveRateLimit) {
        const httpMethod = method || request.method;
        if (httpMethod === "GET") {
          effectiveRateLimit = rateLimitPresets.read;
        } else if (["POST", "PUT", "PATCH", "DELETE"].includes(httpMethod)) {
          effectiveRateLimit = rateLimitPresets.write;
        } else {
          effectiveRateLimit = rateLimitPresets.read;
        }
      }

      // Authentication first (before rate limiting authenticated users)
      const authResult = await requireAuth(request);

      if (authResult.error) {
        // Apply stricter rate limit for failed auth attempts
        const limitResult = rateLimit(
          `failed-auth:${ipAddress}`,
          rateLimitPresets.auth.max,
          rateLimitPresets.auth.window
        );

        if (!limitResult.allowed) {
          return errorResponse(
            "Too many authentication failures. Please try again later.",
            429,
            {
              retryAfter: limitResult.retryAfter,
              resetTime: new Date(limitResult.resetTime).toISOString(),
            }
          );
        }

        return errorResponse(authResult.error, authResult.status);
      }

      const { user, session } = authResult;

      // Rate limiting (use user-based identifier after successful auth)
      if (effectiveRateLimit) {
        const identifier = `user:${user.id}:${request.method}`;
        const limitResult = rateLimit(
          identifier,
          effectiveRateLimit.max,
          effectiveRateLimit.window
        );

        if (!limitResult.allowed) {
          return errorResponse(
            "Rate limit exceeded. Please slow down your requests.",
            429,
            {
              retryAfter: limitResult.retryAfter,
              resetTime: new Date(limitResult.resetTime).toISOString(),
              limit: effectiveRateLimit.max,
              window: `${effectiveRateLimit.window / 1000} seconds`,
            }
          );
        }

        // Add rate limit headers
        const headers = {
          "X-RateLimit-Limit": effectiveRateLimit.max.toString(),
          "X-RateLimit-Remaining": limitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(limitResult.resetTime).toISOString(),
        };

        // Store headers to add to response
        request.rateLimitHeaders = headers;
      }

      // Role-based authorization
      if (roles) {
        const roleCheck = requireRole(user, roles);
        if (roleCheck) {
          return errorResponse(roleCheck.error, roleCheck.status);
        }
      }

      // Attach context to request
      request.auth = {
        user,
        session,
        ipAddress,
        userAgent,
      };

      // Call the actual handler
      const response = await handler(request, context);

      // Add rate limit headers to response
      if (request.rateLimitHeaders && response) {
        Object.entries(request.rateLimitHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      // Audit logging (if enabled)
      if (
        auditLog &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
      ) {
        const method = request.method;
        const path = new URL(request.url).pathname;

        await createAuditLog({
          userId: user.id,
          action:
            method === "POST"
              ? "CREATE"
              : method === "DELETE"
                ? "DELETE"
                : "UPDATE",
          resource: "API",
          resourceId: path,
          description: `${method} ${path}`,
          metadata: null,
          ipAddress,
          userAgent,
        }).catch((err) => {
          console.error("Failed to create audit log:", err);
        });
      }

      return response;
    } catch (error) {
      console.error("API Error:", error);

      return errorResponse(
        "Internal server error",
        500,
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              stack: error.stack,
            }
          : null
      );
    }
  };
}

/**
 * Wrapper for public API routes (no auth required)
 */
export function publicRoute(handler, options = {}) {
  const { rateLimit: rateLimitConfig = rateLimitPresets.read } = options;

  return async (request, context) => {
    try {
      // Handle OPTIONS preflight
      if (request.method === "OPTIONS") {
        return handleOptions();
      }

      // Get client info
      const ipAddress = getClientIp(request);
      const userAgent = getUserAgent(request);

      // Rate limiting (IP-based for public routes)
      if (rateLimitConfig) {
        const identifier = `public:${ipAddress}:${request.method}`;
        const limitResult = rateLimit(
          identifier,
          rateLimitConfig.max,
          rateLimitConfig.window
        );

        if (!limitResult.allowed) {
          return errorResponse(
            "Rate limit exceeded. Please try again later.",
            429,
            {
              retryAfter: limitResult.retryAfter,
              resetTime: new Date(limitResult.resetTime).toISOString(),
            }
          );
        }

        // Add rate limit headers
        const headers = {
          "X-RateLimit-Limit": rateLimitConfig.max.toString(),
          "X-RateLimit-Remaining": limitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(limitResult.resetTime).toISOString(),
        };

        request.rateLimitHeaders = headers;
      }

      // Attach IP info to request
      request.clientInfo = {
        ipAddress,
        userAgent,
      };

      // Call the actual handler
      const response = await handler(request, context);

      // Add rate limit headers to response
      if (request.rateLimitHeaders && response) {
        Object.entries(request.rateLimitHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;
    } catch (error) {
      console.error("API Error:", error);

      return errorResponse(
        "Internal server error",
        500,
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              stack: error.stack,
            }
          : null
      );
    }
  };
}
