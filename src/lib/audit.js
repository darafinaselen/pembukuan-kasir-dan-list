/**
 * Audit Logging Utilities
 * Records all user actions for compliance and security
 */

import { prisma } from "./prisma";

/**
 * Create audit log entry
 * @param {object} params - Audit log parameters
 * @param {string} params.userId - User ID (optional for system actions)
 * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, etc.)
 * @param {string} params.resource - Resource type (Transaction, Armada, User, etc.)
 * @param {string} params.resourceId - ID of affected resource
 * @param {string} params.description - Human-readable description
 * @param {object} params.metadata - Additional data (before/after values)
 * @param {string} params.ipAddress - Client IP address
 * @param {string} params.userAgent - Client user agent
 * @returns {Promise<object>} Created audit log
 */
export async function createAuditLog({
  userId,
  action,
  resource,
  resourceId,
  description,
  metadata = null,
  ipAddress,
  userAgent,
}) {
  return await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      description,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Log authentication event
 * @param {string} userId - User ID
 * @param {string} action - LOGIN or LOGOUT
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - User agent
 * @param {boolean} success - Whether authentication was successful
 */
export async function logAuthEvent(
  userId,
  action,
  ipAddress,
  userAgent,
  success = true
) {
  const description = success
    ? `User ${action.toLowerCase()} successful`
    : `User ${action.toLowerCase()} failed`;

  return await createAuditLog({
    userId,
    action,
    resource: "Authentication",
    resourceId: userId,
    description,
    metadata: { success },
    ipAddress,
    userAgent,
  });
}

/**
 * Log transaction event
 * @param {string} userId - User ID
 * @param {string} action - CREATE, UPDATE, DELETE, VIEW
 * @param {string} transactionId - Transaction ID
 * @param {object} changes - Changed data
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - User agent
 */
export async function logTransactionEvent(user, action, transaction, request) {
  let description = "";
  const invoice_code = transaction?.invoice_code || transaction?.id || "N/A";

  switch (action) {
    case "CREATE":
      description = `Created transaction ${invoice_code}`;
      break;
    case "UPDATE":
      description = `Updated transaction ${invoice_code}`;
      break;
    case "DELETE":
      description = `Deleted transaction ${invoice_code}`;
      break;
    case "VIEW":
      description = `Viewed transaction ${invoice_code}`;
      break;
    case "COMPLETE":
      description = `Completed transaction ${invoice_code}`;
      break;
    case "SUBMIT_APPROVAL":
      description = `Submitted transaction ${invoice_code} for approval`;
      break;
    case "APPROVE":
      description = `Approved transaction ${invoice_code}`;
      break;
    case "REJECT":
      description = `Rejected transaction ${invoice_code}`;
      break;
    default:
      description = `${action} transaction ${invoice_code}`;
  }

  const ipAddress =
    request?.headers?.get("x-forwarded-for") ||
    request?.headers?.get("x-real-ip") ||
    "unknown";
  const userAgent = request?.headers?.get("user-agent") || "unknown";

  return await createAuditLog({
    userId: user?.id ? String(user.id) : user?.email || "unknown",
    action,
    resource: "Transaction",
    resourceId: transaction?.id,
    description,
    metadata: transaction,
    ipAddress,
    userAgent,
  });
}

/**
 * Log expense event
 * @param {string} userId - User ID
 * @param {string} action - CREATE, UPDATE, DELETE
 * @param {string} expenseId - Expense ID
 * @param {object} changes - Changed data
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - User agent
 */
export async function logExpenseEvent(
  userId,
  action,
  expenseId,
  changes,
  ipAddress,
  userAgent
) {
  const description = changes
    ? `${action} expense: ${changes.category} - ${changes.description}`
    : `${action} expense ID: ${expenseId}`;

  return await createAuditLog({
    userId,
    action,
    resource: "Expense",
    resourceId: expenseId,
    description,
    metadata: changes || {},
    ipAddress,
    userAgent,
  });
}

/**
 * Log expense approval event
 * @param {object} user - User object performing action
 * @param {string} action - REQUEST_EDIT, REQUEST_DELETE, APPROVE_EDIT, APPROVE_DELETE, REJECT
 * @param {object} expense - Expense object
 * @param {object} request - Request object for IP/UA
 * @param {object} metadata - Additional metadata (reason, changes, etc.)
 */
export async function logExpenseApprovalEvent(
  user,
  action,
  expense,
  request,
  metadata = {}
) {
  let description = "";
  const expenseInfo = expense?.description || expense?.id || "N/A";
  const category = expense?.category || "";

  switch (action) {
    case "REQUEST_EDIT":
      description = `Requested edit approval for expense: ${category} - ${expenseInfo}`;
      break;
    case "REQUEST_DELETE":
      description = `Requested delete approval for expense: ${category} - ${expenseInfo}`;
      break;
    case "APPROVE_EDIT":
      description = `Approved edit request for expense: ${category} - ${expenseInfo}`;
      break;
    case "APPROVE_DELETE":
      description = `Approved delete request for expense: ${category} - ${expenseInfo}`;
      break;
    case "REJECT":
      description = `Rejected approval request for expense: ${category} - ${expenseInfo}`;
      break;
    default:
      description = `${action} expense approval: ${category} - ${expenseInfo}`;
  }

  const ipAddress =
    request?.headers?.get("x-forwarded-for") ||
    request?.headers?.get("x-real-ip") ||
    "unknown";
  const userAgent = request?.headers?.get("user-agent") || "unknown";

  return await createAuditLog({
    userId: user?.id ? String(user.id) : user?.email || "unknown",
    action,
    resource: "Expense",
    resourceId: expense?.id,
    description,
    metadata: {
      category: expense?.category,
      amount: expense?.amount,
      date: expense?.date,
      approval_status: expense?.approval_status,
      ...metadata,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log report access
 * @param {string} userId - User ID
 * @param {string} reportType - Type of report accessed
 * @param {object} filters - Report filters used
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - User agent
 */
export async function logReportAccess(
  userId,
  reportType,
  filters,
  ipAddress,
  userAgent
) {
  return await createAuditLog({
    userId,
    action: "VIEW",
    resource: "Report",
    resourceId: null,
    description: `Accessed ${reportType} report`,
    metadata: { reportType, filters },
    ipAddress,
    userAgent,
  });
}

/**
 * Log data export
 * @param {string} userId - User ID
 * @param {string} dataType - Type of data exported
 * @param {object} filters - Export filters
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - User agent
 */
export async function logDataExport(
  userId,
  dataType,
  filters,
  ipAddress,
  userAgent
) {
  return await createAuditLog({
    userId,
    action: "EXPORT",
    resource: dataType,
    resourceId: null,
    description: `Exported ${dataType} data`,
    metadata: { filters, exportedAt: new Date().toISOString() },
    ipAddress,
    userAgent,
  });
}

/**
 * Log armada (vehicle) event
 * @param {string} userId - User ID
 * @param {string} action - CREATE, UPDATE, DELETE
 * @param {string} armadaId - Armada ID
 * @param {object} changes - Changed data
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - User agent
 */
export async function logArmadaEvent(
  userId,
  action,
  armadaId,
  changes,
  ipAddress,
  userAgent
) {
  const description = changes?.license_plate
    ? `${action} armada: ${changes.license_plate} (${changes.brand} ${changes.model})`
    : `${action} armada ID: ${armadaId}`;

  return await createAuditLog({
    userId,
    action,
    resource: "Armada",
    resourceId: armadaId,
    description,
    metadata: changes || {},
    ipAddress,
    userAgent,
  });
}

/**
 * Log driver event
 * @param {string} userId - User ID
 * @param {string} action - CREATE, UPDATE, DELETE
 * @param {string} driverId - Driver ID
 * @param {object} changes - Changed data
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - User agent
 */
export async function logDriverEvent(
  userId,
  action,
  driverId,
  changes,
  ipAddress,
  userAgent
) {
  const description = changes?.name
    ? `${action} driver: ${changes.name}`
    : `${action} driver ID: ${driverId}`;

  return await createAuditLog({
    userId,
    action,
    resource: "Driver",
    resourceId: driverId,
    description,
    metadata: changes || {},
    ipAddress,
    userAgent,
  });
}

/**
 * Log user management event
 * @param {string} userId - User ID (admin performing action)
 * @param {string} action - CREATE, UPDATE, DELETE
 * @param {string} targetUserId - Target user ID
 * @param {object} changes - Changed data
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - User agent
 */
export async function logUserEvent(
  userId,
  action,
  targetUserId,
  changes,
  ipAddress,
  userAgent
) {
  const description = changes?.username
    ? `${action} user: ${changes.username} (${changes.name})`
    : `${action} user ID: ${targetUserId}`;

  return await createAuditLog({
    userId,
    action,
    resource: "User",
    resourceId: targetUserId,
    description,
    metadata: changes || {},
    ipAddress,
    userAgent,
  });
}

/**
 * Log staff event
 * @param {string} userId - User ID
 * @param {string} action - CREATE, UPDATE, DELETE
 * @param {string} staffId - Staff ID
 * @param {object} changes - Changed data
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - User agent
 */
export async function logStaffEvent(
  userId,
  action,
  staffId,
  changes,
  ipAddress,
  userAgent
) {
  const description = changes?.staff_name
    ? `${action} staff: ${changes.staff_name} (${changes.position})`
    : `${action} staff ID: ${staffId}`;

  return await createAuditLog({
    userId,
    action,
    resource: "Staff",
    resourceId: staffId,
    description,
    metadata: changes || {},
    ipAddress,
    userAgent,
  });
}

/**
 * Log package event
 * @param {string} userId - User ID
 * @param {string} action - CREATE, UPDATE, DELETE
 * @param {string} packageId - Package ID
 * @param {object} changes - Changed data
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - User agent
 */
export async function logPackageEvent(
  userId,
  action,
  packageId,
  changes,
  ipAddress,
  userAgent
) {
  const description = changes?.name
    ? `${action} package: ${changes.name} (${changes.type})`
    : `${action} package ID: ${packageId}`;

  return await createAuditLog({
    userId,
    action,
    resource: "Package",
    resourceId: packageId,
    description,
    metadata: changes || {},
    ipAddress,
    userAgent,
  });
}

/**
 * Get audit logs with filters
 * @param {object} filters - Filter options
 * @param {string} filters.userId - Filter by user
 * @param {string} filters.action - Filter by action
 * @param {string} filters.resource - Filter by resource type
 * @param {Date} filters.startDate - Start date
 * @param {Date} filters.endDate - End date
 * @param {number} filters.limit - Limit results
 * @param {number} filters.offset - Offset for pagination
 * @returns {Promise<array>} Audit logs
 */
export async function getAuditLogs(filters = {}) {
  const {
    userId,
    action,
    resource,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = filters;

  const where = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
    hasMore: offset + logs.length < total,
  };
}

/**
 * Get audit summary statistics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<object>} Statistics
 */
export async function getAuditStatistics(startDate, endDate) {
  const where = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  const [totalLogs, byAction, byResource, byUser] = await Promise.all([
    prisma.auditLog.count({ where }),

    prisma.auditLog.groupBy({
      by: ["action"],
      where,
      _count: true,
    }),

    prisma.auditLog.groupBy({
      by: ["resource"],
      where,
      _count: true,
    }),

    prisma.auditLog.groupBy({
      by: ["userId"],
      where,
      _count: true,
      orderBy: {
        _count: {
          userId: "desc",
        },
      },
      take: 10,
    }),
  ]);

  return {
    totalLogs,
    byAction: byAction.map((item) => ({
      action: item.action,
      count: item._count,
    })),
    byResource: byResource.map((item) => ({
      resource: item.resource,
      count: item._count,
    })),
    topUsers: byUser.map((item) => ({
      userId: item.userId,
      count: item._count,
    })),
  };
}

/**
 * Clean up old audit logs (retention policy)
 * @param {number} retentionDays - Days to keep logs (default: 365)
 * @returns {Promise<number>} Number of deleted logs
 */
export async function cleanupOldAuditLogs(retentionDays = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
