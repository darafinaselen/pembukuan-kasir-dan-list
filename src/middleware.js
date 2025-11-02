/**
 * Next.js Middleware
 * Handles authentication, authorization, and security at the edge
 */

import { NextResponse } from "next/server";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/api/auth/login"];

// API paths that require authentication
const PROTECTED_API_PATHS = [
  "/api/dashboard",
  "/api/transaksi",
  "/api/laporan",
  "/api/armada",
  "/api/packages",
  "/api/sopir",
  "/api/expenses",
  "/api/auth/logout",
  "/api/auth/session",
];

// Admin-only paths
const ADMIN_PATHS = ["/api/auth/register", "/api/users", "/api/audit"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path))
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check if path requires authentication
  const requiresAuth =
    PROTECTED_API_PATHS.some((path) => pathname.startsWith(path)) ||
    ADMIN_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/transaksi");

  if (!requiresAuth) {
    return addSecurityHeaders(NextResponse.next());
  }

  // For API routes, authentication is handled by individual route handlers
  // This middleware just adds security headers
  if (pathname.startsWith("/api/")) {
    return addSecurityHeaders(NextResponse.next());
  }

  // For page routes, check for session token in cookies
  const token = request.cookies.get("session")?.value;

  if (!token) {
    // Redirect to login if no token
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return addSecurityHeaders(NextResponse.next());
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response) {
  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
