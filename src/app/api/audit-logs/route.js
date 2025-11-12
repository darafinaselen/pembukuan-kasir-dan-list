import {
  protectedRoute,
  successResponse,
  errorResponse,
  permissions,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/audit-logs
 * Retrieve audit logs with filtering and pagination
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 * - action: Filter by action type (CREATE, UPDATE, DELETE, etc.)
 * - resource: Filter by resource type (Transaction, Armada, etc.)
 * - userId: Filter by user ID
 * - from: Start date (YYYY-MM-DD)
 * - to: End date (YYYY-MM-DD)
 */
async function handleGetAuditLogs(request) {
  try {
    // Only ADMIN can view audit logs
    if (!permissions.canViewAuditLogs(request.auth.user)) {
      return errorResponse("Hanya admin yang dapat melihat audit log", 403);
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Filters
    const action = searchParams.get("action");
    const resource = searchParams.get("resource");
    const userId = searchParams.get("userId");
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    // Build where clause
    const where = {};

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (userId) {
      where.userId = userId;
    }

    if (fromStr || toStr) {
      where.createdAt = {};

      if (fromStr) {
        const fromDate = new Date(fromStr);
        where.createdAt.gte = fromDate;
      }

      if (toStr) {
        const toDate = new Date(toStr);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.auditLog.count({ where });

    // Get audit logs with user info
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return successResponse({
      logs: auditLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return errorResponse("Gagal mengambil data audit log", 500);
  }
}

/**
 * GET /api/audit-logs/stats
 * Get statistics about audit logs
 */
async function handleGetAuditStats(request) {
  try {
    // Only ADMIN can view audit logs
    if (!permissions.isAdmin(request.auth.user)) {
      return errorResponse("Hanya admin yang dapat melihat audit log", 403);
    }

    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const where = {};

    if (fromStr || toStr) {
      where.createdAt = {};

      if (fromStr) {
        const fromDate = new Date(fromStr);
        where.createdAt.gte = fromDate;
      }

      if (toStr) {
        const toDate = new Date(toStr);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // Get action counts
    const actionCounts = await prisma.auditLog.groupBy({
      by: ["action"],
      where,
      _count: {
        action: true,
      },
    });

    // Get resource counts
    const resourceCounts = await prisma.auditLog.groupBy({
      by: ["resource"],
      where,
      _count: {
        resource: true,
      },
    });

    // Get total logs
    const totalLogs = await prisma.auditLog.count({ where });

    // Get unique users
    const uniqueUsers = await prisma.auditLog.findMany({
      where,
      select: {
        userId: true,
      },
      distinct: ["userId"],
    });

    return successResponse({
      totalLogs,
      uniqueUsers: uniqueUsers.length,
      byAction: actionCounts.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {}),
      byResource: resourceCounts.reduce((acc, item) => {
        acc[item.resource] = item._count.resource;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    return errorResponse("Gagal mengambil statistik audit log", 500);
  }
}

export const GET = protectedRoute(handleGetAuditLogs, {
  roles: ["ADMIN"],
});
