/**
 * Unit Tests for Approval Workflow System
 * Tests: Submit, Approve, Reject endpoints + Edit/Delete protection
 */

// Mock Next.js server components before any imports
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    }),
  },
}));

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    armada: {
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    driver: {
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock audit
jest.mock("@/lib/audit", () => ({
  logTransactionEvent: jest.fn(),
  createAuditLog: jest.fn(),
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  getSession: jest.fn(),
}));

// Mock utils - must match exact export structure
jest.mock("@/lib/utils", () => ({
  successResponse: (data, status = 200) => ({
    json: async () => ({ success: true, data }),
    status,
    ok: status >= 200 && status < 300,
  }),
  errorResponse: (error, status = 500) => ({
    json: async () => ({ success: false, error }),
    status,
    ok: false,
  }),
}));

// Mock middleware
jest.mock("@/lib/middleware", () => ({
  protectedRoute: (handler, roles) => handler,
  successResponse: (data, status = 200) => ({
    json: async () => ({ success: true, data }),
    status,
    ok: status >= 200 && status < 300,
  }),
  errorResponse: (error, status = 500) => ({
    json: async () => ({ success: false, error }),
    status,
    ok: false,
  }),
  permissions: {
    canViewTransactions: jest.fn(() => true),
    canUpdateTransaction: jest.fn(() => true),
    canDeleteTransaction: jest.fn(() => true),
  },
  getClientIp: jest.fn(() => "127.0.0.1"),
  getUserAgent: jest.fn(() => "jest-test"),
}));

// Mock validators
jest.mock("@/lib/validators/transaction-validator", () => ({
  validateTransactionData: jest.fn(() => ({
    success: true,
    data: {
      customer_name: "Test",
      customer_phone: "08123456789",
      booking_date: new Date(),
      checkout_datetime: new Date(),
      checkin_datetime: new Date(),
      all_in_rate: 500000,
      overtime_rate_per_hour: 50000,
      dp_amount: 0,
      payment_status: "UNPAID",
      armadaId: "armada-1",
      driverId: "driver-1",
      packageId: "package-1",
    },
  })),
}));

import { prisma } from "@/lib/prisma";

// Import handlers after mocks
const submitModule = require("@/app/api/transactions/[id]/submit/route");
const approveModule = require("@/app/api/transactions/[id]/approve/route");
const rejectModule = require("@/app/api/transactions/[id]/reject/route");
const pendingModule = require("@/app/api/transactions/pending/route");
const transactionModule = require("@/app/api/transactions/[id]/route");

const submitHandler = submitModule.POST;
const approveHandler = approveModule.POST;
const rejectHandler = rejectModule.POST;
const pendingHandler = pendingModule.GET;
const updateHandler = transactionModule.PUT;
const deleteHandler = transactionModule.DELETE;

// Mock request helper
const createMockRequest = (body = {}, user = {}, headers = {}) => {
  const mockHeaders = new Map(
    Object.entries({
      "content-type": "application/json",
      "user-agent": "jest-test",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    })
  );

  return {
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: (key) => mockHeaders.get(key.toLowerCase()),
    },
    user: {
      id: "user-1",
      email: user.email || "test@example.com",
      role: user.role || "ADMIN",
      ...user,
    },
    auth: {
      user: {
        id: "user-1",
        email: user.email || "test@example.com",
        role: user.role || "ADMIN",
        ...user,
      },
    },
    url: "http://localhost:3000/api/test",
  };
};

const createMockParams = (id) => ({
  params: Promise.resolve({ id }),
});

describe("Approval Workflow - Submit Transaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should submit DRAFT transaction to PENDING", async () => {
    const mockTransaction = {
      id: "trans-1",
      invoice_code: "RLM-20251112-ABC123",
      approval_status: "DRAFT",
      customer_name: "Test Customer",
    };

    const mockUpdatedTransaction = {
      ...mockTransaction,
      approval_status: "PENDING",
      submitted_at: new Date(),
      submitted_by: "operator@example.com",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    prisma.transaction.update.mockResolvedValue(mockUpdatedTransaction);

    const request = createMockRequest(
      {},
      { email: "operator@example.com", role: "OPERATOR" }
    );
    const params = createMockParams("trans-1");

    const response = await submitHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.transaction.approval_status).toBe("PENDING");
    expect(data.data.message).toContain("berhasil diajukan");
  });

  test("should reject if transaction not found", async () => {
    prisma.transaction.findUnique.mockResolvedValue(null);

    const request = createMockRequest();
    const params = createMockParams("invalid-id");

    const response = await submitHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak ditemukan");
  });

  test("should reject if transaction is not in DRAFT status", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "PENDING",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const request = createMockRequest();
    const params = createMockParams("trans-1");

    const response = await submitHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak dapat diajukan");
  });

  test("should allow OPERATOR to submit", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "DRAFT",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    prisma.transaction.update.mockResolvedValue({
      ...mockTransaction,
      approval_status: "PENDING",
    });

    const request = createMockRequest({}, { role: "OPERATOR" });
    const params = createMockParams("trans-1");

    const response = await submitHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("Approval Workflow - Approve Transaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should approve PENDING transaction to APPROVED", async () => {
    const mockTransaction = {
      id: "trans-1",
      invoice_code: "RLM-20251112-ABC123",
      approval_status: "PENDING",
      submitted_by: "operator@example.com",
      checkout_datetime: new Date(),
      armadaId: "armada-1",
      driverId: "driver-1",
    };

    const mockApprovedTransaction = {
      ...mockTransaction,
      approval_status: "APPROVED",
      approved_at: new Date(),
      approved_by: "admin@example.com",
      armada: { id: "armada-1", status: "READY" },
      driver: { id: "driver-1", status: "READY" },
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    prisma.armada.findFirst.mockResolvedValue({ id: "armada-1", status: "READY" });
    prisma.driver.findFirst.mockResolvedValue({ id: "driver-1", status: "READY" });
    prisma.armada.update.mockResolvedValue({ id: "armada-1", status: "BOOKED" });
    prisma.driver.update.mockResolvedValue({ id: "driver-1", status: "BOOKED" });
    
    // Mock $transaction to return the updated transaction
    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        transaction: {
          update: jest.fn().mockResolvedValue(mockApprovedTransaction),
        },
        armada: {
          findFirst: prisma.armada.findFirst,
          update: prisma.armada.update,
        },
        driver: {
          findFirst: prisma.driver.findFirst,
          update: prisma.driver.update,
        },
      };
      return await callback(tx);
    });

    const request = createMockRequest(
      {},
      { email: "admin@example.com", role: "ADMIN" }
    );
    const params = createMockParams("trans-1");

    const response = await approveHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.transaction.approval_status).toBe("APPROVED");
    expect(data.data.message).toContain("berhasil disetujui");
  });

  test("should reject if transaction is not in PENDING status", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "DRAFT",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const request = createMockRequest({}, { role: "ADMIN" });
    const params = createMockParams("trans-1");

    const response = await approveHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak dapat disetujui");
  });

  test("should allow ADMIN to approve", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "PENDING",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    prisma.transaction.update.mockResolvedValue({
      ...mockTransaction,
      approval_status: "APPROVED",
    });

    const request = createMockRequest({}, { role: "ADMIN" });
    const params = createMockParams("trans-1");

    const response = await approveHandler(request, params);

    expect(response.status).toBe(200);
  });
});

describe("Approval Workflow - Reject Transaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should reject PENDING transaction with reason", async () => {
    const mockTransaction = {
      id: "trans-1",
      invoice_code: "RLM-20251112-ABC123",
      approval_status: "PENDING",
      armadaId: "armada-1",
      driverId: "driver-1",
    };

    const rejectionReason = "Data tidak lengkap";

    const mockRejectedTransaction = {
      ...mockTransaction,
      approval_status: "REJECTED",
      rejected_at: new Date(),
      rejected_by: "admin@example.com",
      rejection_reason: rejectionReason,
      armada: { id: "armada-1", status: "READY" },
      driver: { id: "driver-1", status: "READY" },
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    prisma.armada.update.mockResolvedValue({ id: "armada-1", status: "READY" });
    prisma.driver.update.mockResolvedValue({ id: "driver-1", status: "READY" });
    
    // Mock $transaction to return the updated transaction
    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        transaction: {
          update: jest.fn().mockResolvedValue(mockRejectedTransaction),
        },
        armada: {
          update: prisma.armada.update,
        },
        driver: {
          update: prisma.driver.update,
        },
      };
      return await callback(tx);
    });

    const request = createMockRequest(
      { rejection_reason: rejectionReason },
      { email: "admin@example.com", role: "ADMIN" }
    );
    const params = createMockParams("trans-1");

    const response = await rejectHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.transaction.approval_status).toBe("REJECTED");
    expect(data.data.transaction.rejection_reason).toBe(rejectionReason);
    expect(data.data.message).toContain("berhasil ditolak");
  });

  test("should reject if rejection_reason is empty", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "PENDING",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const request = createMockRequest(
      { rejection_reason: "" },
      { role: "ADMIN" }
    );
    const params = createMockParams("trans-1");

    const response = await rejectHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("harus diisi");
  });

  test("should reject if rejection_reason is missing", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "PENDING",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const request = createMockRequest({}, { role: "ADMIN" });
    const params = createMockParams("trans-1");

    const response = await rejectHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  test("should reject if transaction is not in PENDING status", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "APPROVED",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const request = createMockRequest(
      { rejection_reason: "Test" },
      { role: "ADMIN" }
    );
    const params = createMockParams("trans-1");

    const response = await rejectHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak dapat ditolak");
  });
});

describe("Approval Workflow - Get Pending Transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return list of pending transactions with pagination", async () => {
    const mockTransactions = [
      {
        id: "trans-1",
        invoice_code: "RLM-20251112-ABC123",
        approval_status: "PENDING",
        submitted_at: new Date("2025-11-12T10:00:00Z"),
        submitted_by: "operator@example.com",
        customer_name: "Customer 1",
      },
      {
        id: "trans-2",
        invoice_code: "RLM-20251112-DEF456",
        approval_status: "PENDING",
        submitted_at: new Date("2025-11-12T11:00:00Z"),
        submitted_by: "operator@example.com",
        customer_name: "Customer 2",
      },
    ];

    prisma.transaction.findMany.mockResolvedValue(mockTransactions);
    prisma.transaction.count.mockResolvedValue(2);

    const request = createMockRequest({}, { role: "ADMIN" });
    request.url =
      "http://localhost:3000/api/transactions/pending?page=1&limit=10";

    const response = await pendingHandler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.transactions).toHaveLength(2);
    expect(data.data.pagination.total).toBe(2);
    expect(data.data.pagination.page).toBe(1);
  });

  test("should handle empty pending list", async () => {
    prisma.transaction.findMany.mockResolvedValue([]);
    prisma.transaction.count.mockResolvedValue(0);

    const request = createMockRequest({}, { role: "ADMIN" });
    request.url = "http://localhost:3000/api/transactions/pending";

    const response = await pendingHandler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.transactions).toHaveLength(0);
    expect(data.data.pagination.total).toBe(0);
  });

  test("should handle pagination parameters", async () => {
    prisma.transaction.findMany.mockResolvedValue([]);
    prisma.transaction.count.mockResolvedValue(25);

    const request = createMockRequest({}, { role: "ADMIN" });
    request.url =
      "http://localhost:3000/api/transactions/pending?page=2&limit=10";

    const response = await pendingHandler(request);
    const data = await response.json();

    expect(data.data.pagination.page).toBe(2);
    expect(data.data.pagination.limit).toBe(10);
    expect(data.data.pagination.totalPages).toBe(3);
  });
});

describe("Approval Workflow - Edit Protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should prevent editing PENDING transaction", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "PENDING",
      customer_name: "Test Customer",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const request = createMockRequest(
      { customer_name: "Updated Name" },
      { role: "OPERATOR" }
    );
    const params = createMockParams("trans-1");

    const response = await updateHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain("sedang menunggu persetujuan");
  });

  test("should prevent editing APPROVED transaction", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "APPROVED",
      customer_name: "Test Customer",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const request = createMockRequest(
      { customer_name: "Updated Name" },
      { role: "ADMIN" }
    );
    const params = createMockParams("trans-1");

    const response = await updateHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain("sudah disetujui tidak dapat diedit");
  });

  test("should allow editing DRAFT transaction", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "DRAFT",
      customer_name: "Test Customer",
      armadaId: "armada-1",
      driverId: "driver-1",
    };

    const mockUpdatedTransaction = {
      ...mockTransaction,
      customer_name: "Updated Name",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    prisma.$transaction.mockResolvedValue(mockUpdatedTransaction);

    const request = createMockRequest(
      {
        customer_name: "Updated Name",
        customer_phone: "08123456789",
        booking_date: new Date(),
        checkout_datetime: new Date(),
        checkin_datetime: new Date(),
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        dp_amount: 0,
        payment_status: "UNPAID",
        armadaId: "armada-1",
        driverId: "driver-1",
        packageId: "package-1",
      },
      { role: "OPERATOR" }
    );
    const params = createMockParams("trans-1");

    const response = await updateHandler(request, params);

    // Should not return 403 error for DRAFT
    expect(response.status).not.toBe(403);
  });

  test("should allow editing REJECTED transaction", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "REJECTED",
      rejection_reason: "Data tidak lengkap",
      customer_name: "Test Customer",
      armadaId: "armada-1",
      driverId: "driver-1",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    prisma.$transaction.mockResolvedValue({
      ...mockTransaction,
      customer_name: "Updated Name",
    });

    const request = createMockRequest(
      {
        customer_name: "Updated Name",
        customer_phone: "08123456789",
        booking_date: new Date(),
        checkout_datetime: new Date(),
        checkin_datetime: new Date(),
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        dp_amount: 0,
        payment_status: "UNPAID",
        armadaId: "armada-1",
        driverId: "driver-1",
        packageId: "package-1",
      },
      { role: "OPERATOR" }
    );
    const params = createMockParams("trans-1");

    const response = await updateHandler(request, params);

    // Should not return 403 error for REJECTED
    expect(response.status).not.toBe(403);
  });
});

describe("Approval Workflow - Delete Protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should prevent deleting PENDING transaction", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "PENDING",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const request = createMockRequest({}, { role: "ADMIN" });
    const params = createMockParams("trans-1");

    const response = await deleteHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak dapat dihapus");
  });

  test("should prevent deleting APPROVED transaction", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "APPROVED",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const request = createMockRequest({}, { role: "ADMIN" });
    const params = createMockParams("trans-1");

    const response = await deleteHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak dapat dihapus");
  });

  test("should allow deleting DRAFT transaction", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "DRAFT",
      armadaId: "armada-1",
      driverId: "driver-1",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    prisma.$transaction.mockResolvedValue([]);

    const request = createMockRequest({}, { role: "ADMIN" });
    const params = createMockParams("trans-1");

    const response = await deleteHandler(request, params);

    // Should not return 403 error for DRAFT
    expect(response.status).not.toBe(403);
  });

  test("should allow deleting REJECTED transaction", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "REJECTED",
      armadaId: "armada-1",
      driverId: "driver-1",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    prisma.$transaction.mockResolvedValue([]);

    const request = createMockRequest({}, { role: "ADMIN" });
    const params = createMockParams("trans-1");

    const response = await deleteHandler(request, params);

    // Should not return 403 error for REJECTED
    expect(response.status).not.toBe(403);
  });
});

describe("Approval Workflow - Status Transitions", () => {
  test("should follow correct status flow: DRAFT → PENDING → APPROVED", async () => {
    const transactionId = "trans-1";
    let currentTransaction = {
      id: transactionId,
      approval_status: "DRAFT",
    };

    // Step 1: Submit DRAFT to PENDING
    prisma.transaction.findUnique.mockResolvedValue(currentTransaction);
    prisma.transaction.update.mockResolvedValue({
      ...currentTransaction,
      approval_status: "PENDING",
    });

    const submitRequest = createMockRequest({}, { role: "OPERATOR" });
    const submitResponse = await submitHandler(
      submitRequest,
      createMockParams(transactionId)
    );
    let data = await submitResponse.json();

    expect(data.data.transaction.approval_status).toBe("PENDING");

    // Step 2: Approve PENDING to APPROVED
    currentTransaction.approval_status = "PENDING";
    prisma.transaction.findUnique.mockResolvedValue(currentTransaction);
    prisma.transaction.update.mockResolvedValue({
      ...currentTransaction,
      approval_status: "APPROVED",
    });

    // Setup mocks for approve
    currentTransaction.checkout_datetime = new Date();
    currentTransaction.armadaId = "armada-1";
    currentTransaction.driverId = "driver-1";
    prisma.transaction.findUnique.mockResolvedValue(currentTransaction);
    prisma.armada.findFirst.mockResolvedValue({ id: "armada-1", status: "READY" });
    prisma.driver.findFirst.mockResolvedValue({ id: "driver-1", status: "READY" });
    prisma.armada.update.mockResolvedValue({ id: "armada-1", status: "BOOKED" });
    prisma.driver.update.mockResolvedValue({ id: "driver-1", status: "BOOKED" });
    
    const mockApprovedTransaction = {
      ...currentTransaction,
      approval_status: "APPROVED",
      approved_at: new Date(),
      approved_by: "admin@example.com",
      armada: { id: "armada-1", status: "READY" },
      driver: { id: "driver-1", status: "READY" },
    };
    
    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        transaction: {
          update: jest.fn().mockResolvedValue(mockApprovedTransaction),
        },
        armada: {
          findFirst: prisma.armada.findFirst,
          update: prisma.armada.update,
        },
        driver: {
          findFirst: prisma.driver.findFirst,
          update: prisma.driver.update,
        },
      };
      return await callback(tx);
    });

    const approveRequest = createMockRequest({}, { role: "ADMIN" });
    const approveResponse = await approveHandler(
      approveRequest,
      createMockParams(transactionId)
    );
    data = await approveResponse.json();

    expect(data.data.transaction.approval_status).toBe("APPROVED");
  });

  test("should follow correct status flow: DRAFT → PENDING → REJECTED", async () => {
    const transactionId = "trans-1";
    let currentTransaction = {
      id: transactionId,
      approval_status: "DRAFT",
    };

    // Step 1: Submit DRAFT to PENDING
    prisma.transaction.findUnique.mockResolvedValue(currentTransaction);
    prisma.transaction.update.mockResolvedValue({
      ...currentTransaction,
      approval_status: "PENDING",
    });

    const submitRequest = createMockRequest({}, { role: "OPERATOR" });
    const submitResponse = await submitHandler(
      submitRequest,
      createMockParams(transactionId)
    );
    let data = await submitResponse.json();

    expect(data.data.transaction.approval_status).toBe("PENDING");

    // Step 2: Reject PENDING to REJECTED
    currentTransaction.approval_status = "PENDING";
    currentTransaction.armadaId = "armada-1";
    currentTransaction.driverId = "driver-1";
    prisma.transaction.findUnique.mockResolvedValue(currentTransaction);
    prisma.armada.update.mockResolvedValue({ id: "armada-1", status: "READY" });
    prisma.driver.update.mockResolvedValue({ id: "driver-1", status: "READY" });
    
    const mockRejectedTransaction = {
      ...currentTransaction,
      approval_status: "REJECTED",
      rejected_at: new Date(),
      rejected_by: "admin@example.com",
      rejection_reason: "Data tidak valid",
      armada: { id: "armada-1", status: "READY" },
      driver: { id: "driver-1", status: "READY" },
    };
    
    // Clear previous mock implementation and set new one for reject
    prisma.$transaction.mockReset();
    prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        transaction: {
          update: jest.fn().mockResolvedValue(mockRejectedTransaction),
        },
        armada: {
          update: prisma.armada.update,
        },
        driver: {
          update: prisma.driver.update,
        },
      };
      return await callback(tx);
    });

    const rejectRequest = createMockRequest(
      { rejection_reason: "Data tidak valid" },
      { role: "ADMIN" }
    );
    const rejectResponse = await rejectHandler(
      rejectRequest,
      createMockParams(transactionId)
    );
    data = await rejectResponse.json();

    expect(data.data.transaction.approval_status).toBe("REJECTED");
    expect(data.data.transaction.rejection_reason).toBe("Data tidak valid");
  });

  test("should prevent skipping PENDING status", async () => {
    const mockTransaction = {
      id: "trans-1",
      approval_status: "DRAFT",
    };

    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    // Try to approve a DRAFT transaction (should fail)
    const request = createMockRequest({}, { role: "ADMIN" });
    const params = createMockParams("trans-1");

    const response = await approveHandler(request, params);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
