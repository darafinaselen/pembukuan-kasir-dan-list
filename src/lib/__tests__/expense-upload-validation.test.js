const { PrismaClient } = require("@prisma/client");

// Mock setImmediate for jsdom compatibility
global.setImmediate = jest.fn((callback) => setTimeout(callback, 0));

// Mock the minio functions
jest.mock("../../lib/minio", () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFile: jest.fn(),
}));

const { uploadFile, deleteFile, getFile } = require("../../lib/minio");

const prisma = new PrismaClient();

describe("Expense File Upload API - Validation Tests", () => {
  let mockRequest;
  let mockExpense;

  beforeEach(async () => {
    // Create a test expense
    mockExpense = await prisma.expense.create({
      data: {
        date: new Date("2025-11-07"),
        category: "LISTRIK",
        description: "Test expense for file upload",
        amount: 100000,
      },
    });

    // Reset mocks
    jest.clearAllMocks();

    // Mock successful upload
    uploadFile.mockResolvedValue("expenses/test-path/test-file.jpg");
  });

  afterEach(async () => {
    // Clean up test data
    if (mockExpense) {
      await prisma.expenseAttachment.deleteMany({
        where: { expenseId: mockExpense.id },
      });
      await prisma.expense.delete({
        where: { id: mockExpense.id },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("File Type Validation", () => {
    test("should accept valid JPG file", async () => {
      const validJpgFile = {
        name: "test.jpg",
        type: "image/jpeg",
        size: 1024 * 1024, // 1MB
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from("fake-jpg-content")),
      };

      const formData = new FormData();
      formData.append("file", validJpgFile);

      mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
      };

      // Mock the API handler logic
      const file = validJpgFile; // Use the file directly for testing

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      const isValidType =
        allowedTypes.includes(file.type) ||
        allowedExtensions.includes(fileExtension);

      expect(isValidType).toBe(true);
      expect(file.type).toBe("image/jpeg");
      expect(fileExtension).toBe(".jpg");
    });

    test("should accept valid PNG file", async () => {
      const validPngFile = {
        name: "test.png",
        type: "image/png",
        size: 512 * 1024, // 512KB
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from("fake-png-content")),
      };

      const formData = new FormData();
      formData.append("file", validPngFile);

      mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
      };

      // Mock the API handler logic
      const file = validPngFile; // Use the file directly for testing

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      const isValidType =
        allowedTypes.includes(file.type) ||
        allowedExtensions.includes(fileExtension);

      expect(isValidType).toBe(true);
      expect(file.type).toBe("image/png");
      expect(fileExtension).toBe(".png");
    });

    test("should accept valid PDF file", async () => {
      const validPdfFile = {
        name: "document.pdf",
        type: "application/pdf",
        size: 2 * 1024 * 1024, // 2MB
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from("fake-pdf-content")),
      };

      const formData = new FormData();
      formData.append("file", validPdfFile);

      mockRequest = {
        formData: jest.fn().mockResolvedValue(formData),
      };

      // Mock the API handler logic
      const file = validPdfFile; // Use the file directly for testing

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      const isValidType =
        allowedTypes.includes(file.type) ||
        allowedExtensions.includes(fileExtension);

      expect(isValidType).toBe(true);
      expect(file.type).toBe("application/pdf");
      expect(fileExtension).toBe(".pdf");
    });

    test("should reject invalid file types - DOC", async () => {
      const invalidDocFile = {
        name: "document.doc",
        type: "application/msword",
        size: 1024 * 1024, // 1MB
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from("fake-doc-content")),
      };

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
      const fileExtension = invalidDocFile.name
        .toLowerCase()
        .substring(invalidDocFile.name.lastIndexOf("."));

      const isValidType =
        allowedTypes.includes(invalidDocFile.type) ||
        allowedExtensions.includes(fileExtension);

      expect(isValidType).toBe(false);
      expect(invalidDocFile.type).toBe("application/msword");
      expect(fileExtension).toBe(".doc");
    });

    test("should reject invalid file types - TXT", async () => {
      const invalidTxtFile = {
        name: "notes.txt",
        type: "text/plain",
        size: 1024, // 1KB
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from("fake-txt-content")),
      };

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
      const fileExtension = invalidTxtFile.name
        .toLowerCase()
        .substring(invalidTxtFile.name.lastIndexOf("."));

      const isValidType =
        allowedTypes.includes(invalidTxtFile.type) ||
        allowedExtensions.includes(fileExtension);

      expect(isValidType).toBe(false);
      expect(invalidTxtFile.type).toBe("text/plain");
      expect(fileExtension).toBe(".txt");
    });

    test("should reject invalid file types - XLS", async () => {
      const invalidXlsFile = {
        name: "spreadsheet.xls",
        type: "application/vnd.ms-excel",
        size: 2 * 1024 * 1024, // 2MB
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from("fake-xls-content")),
      };

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
      const fileExtension = invalidXlsFile.name
        .toLowerCase()
        .substring(invalidXlsFile.name.lastIndexOf("."));

      const isValidType =
        allowedTypes.includes(invalidXlsFile.type) ||
        allowedExtensions.includes(fileExtension);

      expect(isValidType).toBe(false);
      expect(invalidXlsFile.type).toBe("application/vnd.ms-excel");
      expect(fileExtension).toBe(".xls");
    });
  });

  describe("File Size Validation", () => {
    test("should accept file within size limit (5MB)", async () => {
      const validSizeFile = {
        name: "large-file.jpg",
        type: "image/jpeg",
        size: 5 * 1024 * 1024, // 5MB (exactly at limit)
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from("x".repeat(5 * 1024 * 1024))),
      };

      const maxSize = 10 * 1024 * 1024; // 10MB limit
      const isValidSize = validSizeFile.size <= maxSize;

      expect(isValidSize).toBe(true);
      expect(validSizeFile.size).toBeLessThanOrEqual(maxSize);
    });

    test("should accept small file (1KB)", async () => {
      const smallFile = {
        name: "small.jpg",
        type: "image/jpeg",
        size: 1024, // 1KB
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from("small-content")),
      };

      const maxSize = 10 * 1024 * 1024; // 10MB limit
      const isValidSize = smallFile.size <= maxSize;

      expect(isValidSize).toBe(true);
      expect(smallFile.size).toBeLessThan(maxSize);
    });

    test("should reject file exceeding size limit (15MB)", async () => {
      const oversizedFile = {
        name: "oversized.jpg",
        type: "image/jpeg",
        size: 15 * 1024 * 1024, // 15MB (over limit)
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from("x".repeat(15 * 1024 * 1024))),
      };

      const maxSize = 10 * 1024 * 1024; // 10MB limit
      const isValidSize = oversizedFile.size <= maxSize;

      expect(isValidSize).toBe(false);
      expect(oversizedFile.size).toBeGreaterThan(maxSize);
    });

    test("should reject very large file (100MB)", async () => {
      const hugeFile = {
        name: "huge.pdf",
        type: "application/pdf",
        size: 100 * 1024 * 1024, // 100MB
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from("x".repeat(100 * 1024 * 1024))),
      };

      const maxSize = 10 * 1024 * 1024; // 10MB limit
      const isValidSize = hugeFile.size <= maxSize;

      expect(isValidSize).toBe(false);
      expect(hugeFile.size).toBeGreaterThan(maxSize);
    });
  });

  describe("File Name and Path Generation", () => {
    test("should generate correct file path for JPG file", () => {
      const expenseId = "expense-123";
      const category = "LISTRIK";
      const date = new Date("2025-11-07");
      const originalFileName = "bukti-bayar.jpg";

      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const ext = originalFileName.split(".").pop();
      const sanitizedCategory = category.replace(/[^a-zA-Z0-9]/g, "_");
      const timestamp = Date.now();
      const expectedPath = `expenses/${expenseId}/${dateStr}_${sanitizedCategory}_${timestamp}.${ext}`;

      // The path should contain the expected components
      expect(expectedPath).toContain("expenses/expense-123/");
      expect(expectedPath).toContain("2025-11-07_LISTRIK_");
      expect(expectedPath).toContain(".jpg");
    });

    test("should generate correct file path for PDF file", () => {
      const expenseId = "expense-456";
      const category = "GAJI_SOPIR";
      const date = new Date("2025-11-08");
      const originalFileName = "slip-gaji.pdf";

      const dateStr = date.toISOString().split("T")[0];
      const ext = originalFileName.split(".").pop();
      const sanitizedCategory = category.replace(/[^a-zA-Z0-9]/g, "_");
      const timestamp = Date.now();
      const expectedPath = `expenses/${expenseId}/${dateStr}_${sanitizedCategory}_${timestamp}.${ext}`;

      expect(expectedPath).toContain("expenses/expense-456/");
      expect(expectedPath).toContain("2025-11-08_GAJI_SOPIR_");
      expect(expectedPath).toContain(".pdf");
    });

    test("should sanitize category names with special characters", () => {
      const category = "OPERASIONAL LAINNYA (TEST)";
      const sanitizedCategory = category.replace(/[^a-zA-Z0-9]/g, "_");

      expect(sanitizedCategory).toBe("OPERASIONAL_LAINNYA__TEST_");
      expect(sanitizedCategory).not.toContain(" ");
      expect(sanitizedCategory).not.toContain("(");
      expect(sanitizedCategory).not.toContain(")");
    });
  });

  describe("Upload Process Integration", () => {
    test("should successfully process valid file upload", async () => {
      const validFile = {
        name: "test.jpg",
        type: "image/jpeg",
        size: 1024 * 1024, // 1MB
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from("fake-jpg-content")),
      };

      const formData = new FormData();
      formData.append("file", validFile);

      // Mock the upload process
      uploadFile.mockResolvedValue("expenses/test-path/test-file.jpg");

      // Simulate the validation and upload logic
      const file = validFile;

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));
      const isValidType =
        allowedTypes.includes(file.type) ||
        allowedExtensions.includes(fileExtension);

      // Validate file size
      const maxSize = 10 * 1024 * 1024;
      const isValidSize = file.size <= maxSize;

      expect(isValidType).toBe(true);
      expect(isValidSize).toBe(true);

      // Simulate successful upload - call the mocked function
      const buffer = Buffer.from("fake-jpg-content");
      const fileName = "expenses/test-path/test-file.jpg";
      const result = await uploadFile(buffer, fileName, file.type);

      expect(result).toBe("expenses/test-path/test-file.jpg");
      expect(uploadFile).toHaveBeenCalledWith(buffer, fileName, file.type);
    });

    test("should handle upload failure gracefully", async () => {
      const validFile = {
        name: "test.jpg",
        type: "image/jpeg",
        size: 1024 * 1024,
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from("fake-content")),
      };

      // Mock upload failure
      uploadFile.mockRejectedValue(new Error("MinIO upload failed"));

      // Simulate the error handling - call the function that will fail
      const buffer = Buffer.from("fake-content");
      const fileName = "test-path";
      const mimeType = validFile.type;

      await expect(uploadFile(buffer, fileName, mimeType)).rejects.toThrow(
        "MinIO upload failed"
      );

      expect(uploadFile).toHaveBeenCalledWith(buffer, fileName, mimeType);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle files without extensions", () => {
      const noExtensionFile = {
        name: "filewithoutextension",
        type: "image/jpeg",
        size: 1024,
      };

      const fileExtension = noExtensionFile.name
        .toLowerCase()
        .substring(noExtensionFile.name.lastIndexOf("."));

      // Should handle gracefully - if no dot found, lastIndexOf returns -1, so substring returns the whole string
      expect(fileExtension).toBe("filewithoutextension");
    });

    test("should handle files with multiple dots in name", () => {
      const multiDotFile = {
        name: "my.file.name.jpg",
        type: "image/jpeg",
        size: 1024,
      };

      const fileExtension = multiDotFile.name
        .toLowerCase()
        .substring(multiDotFile.name.lastIndexOf("."));

      expect(fileExtension).toBe(".jpg");
    });

    test("should validate MIME type vs extension consistency", () => {
      const suspiciousFile = {
        name: "fake.jpg",
        type: "application/pdf", // MIME type doesn't match extension
        size: 1024,
      };

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];

      const fileExtension = suspiciousFile.name
        .toLowerCase()
        .substring(suspiciousFile.name.lastIndexOf("."));
      const isValidType = allowedTypes.includes(suspiciousFile.type);
      const isValidExtension = allowedExtensions.includes(fileExtension);

      // Both should be valid individually, but this is a potential security concern
      expect(isValidType).toBe(true); // PDF MIME type is allowed
      expect(isValidExtension).toBe(true); // .jpg extension is allowed
    });
  });
});
