/**
 * Audit Logging Utilities
 * Records all user actions for compliance and security
 */

import { prisma } from "./prisma";
import { formatCurrency } from "./accounting";

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
  let description = "";
  if (action === "LOGIN") {
    description = success ? "Login berhasil" : "Login gagal";
  } else if (action === "LOGOUT") {
    description = "Logout";
  } else {
    description = success
      ? `Autentikasi ${action.toLowerCase()} berhasil`
      : `Autentikasi ${action.toLowerCase()} gagal`;
  }

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
  const customer_name = transaction?.customer_name || "N/A";
  const package_type = transaction?.package?.type || "N/A";
  const amount = transaction?.all_in_rate || 0;
  const formattedAmount = formatCurrency(amount);

  switch (action) {
    case "CREATE":
      description = `Membuat transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    case "UPDATE":
      description = `Mengubah transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    case "DELETE":
      description = `Menghapus transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    case "VIEW":
      description = `Melihat transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    case "COMPLETE":
      description = `Menyelesaikan transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    case "SUBMIT_APPROVAL":
      description = `Mengajukan persetujuan transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    case "APPROVE":
      description = `Menyetujui transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    case "REJECT":
      description = `Menolak transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    case "REQUEST_EDIT":
      description = `Meminta persetujuan edit transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    case "APPROVE_EDIT":
      description = `Menyetujui edit transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    case "REJECT_EDIT":
      description = `Menolak edit transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
      break;
    default:
      description = `${action} transaksi ${invoice_code} - ${customer_name}, ${formattedAmount}, ${package_type}`;
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
  let description = "";
  const category = changes?.category || "N/A";
  const expenseDescription = changes?.description || "N/A";
  const amount = changes?.amount || 0;
  const formattedAmount = formatCurrency(amount);

  switch (action) {
    case "CREATE":
      description = `Membuat pengeluaran: ${category} - ${expenseDescription}, ${formattedAmount}`;
      break;
    case "UPDATE":
      description = `Mengubah pengeluaran: ${category} - ${expenseDescription}, ${formattedAmount}`;
      break;
    case "DELETE":
      description = `Menghapus pengeluaran: ${category} - ${expenseDescription}, ${formattedAmount}`;
      break;
    default:
      description = `${action} pengeluaran: ${category} - ${expenseDescription}, ${formattedAmount}`;
  }

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
  const category = expense?.category || "N/A";
  const amount = expense?.amount || 0;
  const formattedAmount = formatCurrency(amount);

  switch (action) {
    case "REQUEST_EDIT":
      description = `Meminta persetujuan edit pengeluaran: ${category} - ${expenseInfo}, ${formattedAmount}`;
      break;
    case "REQUEST_DELETE":
      description = `Meminta persetujuan hapus pengeluaran: ${category} - ${expenseInfo}, ${formattedAmount}`;
      break;
    case "APPROVE_EDIT":
      description = `Menyetujui edit pengeluaran: ${category} - ${expenseInfo}, ${formattedAmount}`;
      break;
    case "APPROVE_DELETE":
      description = `Menyetujui hapus pengeluaran: ${category} - ${expenseInfo}, ${formattedAmount}`;
      break;
    case "REJECT":
      description = `Menolak permintaan persetujuan pengeluaran: ${category} - ${expenseInfo}, ${formattedAmount}`;
      break;
    default:
      description = `${action} persetujuan pengeluaran: ${category} - ${expenseInfo}, ${formattedAmount}`;
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
    description: `Mengakses laporan ${reportType}`,
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
    description: `Mengekspor data ${dataType}`,
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
  let description = "";
  const licensePlate = changes?.license_plate || "N/A";
  const brand = changes?.brand || "";
  const model = changes?.model || "";

  switch (action) {
    case "CREATE":
      description = `Membuat armada: ${licensePlate} (${brand} ${model})`;
      break;
    case "UPDATE":
      description = `Mengubah armada: ${licensePlate} (${brand} ${model})`;
      break;
    case "DELETE":
      description = `Menghapus armada: ${licensePlate} (${brand} ${model})`;
      break;
    default:
      description = `${action} armada: ${licensePlate} (${brand} ${model})`;
  }

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
  let description = "";
  const name = changes?.name || "N/A";

  switch (action) {
    case "CREATE":
      description = `Membuat sopir: ${name}`;
      break;
    case "UPDATE":
      description = `Mengubah sopir: ${name}`;
      break;
    case "DELETE":
      description = `Menghapus sopir: ${name}`;
      break;
    default:
      description = `${action} sopir: ${name}`;
  }

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
  let description = "";
  const username = changes?.username || "N/A";
  const name = changes?.name || "";

  switch (action) {
    case "CREATE":
      description = `Membuat pengguna: ${username} (${name})`;
      break;
    case "UPDATE":
      description = `Mengubah pengguna: ${username} (${name})`;
      break;
    case "DELETE":
      description = `Menghapus pengguna: ${username} (${name})`;
      break;
    default:
      description = `${action} pengguna: ${username} (${name})`;
  }

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
  let description = "";
  const staffName = changes?.staff_name || "N/A";
  const position = changes?.position || "";

  switch (action) {
    case "CREATE":
      description = `Membuat staf: ${staffName} (${position})`;
      break;
    case "UPDATE":
      description = `Mengubah staf: ${staffName} (${position})`;
      break;
    case "DELETE":
      description = `Menghapus staf: ${staffName} (${position})`;
      break;
    default:
      description = `${action} staf: ${staffName} (${position})`;
  }

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
  let description = "";
  const name = changes?.name || "N/A";
  const type = changes?.type || "";

  switch (action) {
    case "CREATE":
      description = `Membuat paket: ${name} (${type})`;
      break;
    case "UPDATE":
      description = `Mengubah paket: ${name} (${type})`;
      break;
    case "DELETE":
      description = `Menghapus paket: ${name} (${type})`;
      break;
    default:
      description = `${action} paket: ${name} (${type})`;
  }

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
