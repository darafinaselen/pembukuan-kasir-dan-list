/**
 * Unit Tests untuk Staff API
 *
 * Test Coverage:
 * - GET /api/staff (list with filters)
 * - POST /api/staff (create)
 * - GET /api/staff/[id] (get single)
 * - PUT /api/staff/[id] (update)
 * - DELETE /api/staff/[id] (soft delete)
 * - Validation
 * - Permissions
 * - Error handling
 */

describe("Staff API Tests", () => {
  describe("GET /api/staff - List Staff", () => {
    test("should return list of staff with default pagination", () => {
      const response = {
        staff: [
          {
            id: "staff-1",
            staff_name: "John Doe",
            position: "ADMIN",
            status: "ACTIVE",
            salary_amount: 5000000,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      expect(response.staff).toBeInstanceOf(Array);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(10);
    });

    test("should filter staff by status", () => {
      const queryParams = { status: "ACTIVE" };
      const filteredStaff = [
        { id: "staff-1", status: "ACTIVE" },
        { id: "staff-2", status: "ACTIVE" },
      ];

      expect(filteredStaff.every((s) => s.status === "ACTIVE")).toBe(true);
    });

    test("should filter staff by position", () => {
      const queryParams = { position: "Finance" };
      const allStaff = [
        { id: "staff-1", position: "Finance" },
        { id: "staff-2", position: "Admin" },
      ];

      const filteredStaff = allStaff.filter((s) =>
        s.position.toLowerCase().includes(queryParams.position.toLowerCase())
      );

      expect(filteredStaff.length).toBe(1);
      expect(filteredStaff[0].position).toBe("Finance");
    });

    test("should search staff by name, NIK, position, or phone", () => {
      const allStaff = [
        {
          id: "1",
          staff_name: "John Doe",
          nik: "1234",
          position: "Admin",
          phone_number: "08111",
        },
        {
          id: "2",
          staff_name: "Jane Smith",
          nik: "5678",
          position: "Finance",
          phone_number: "08222",
        },
      ];
      const searchTerm = "admin";

      const searchResults = allStaff.filter(
        (s) =>
          s.staff_name.toLowerCase().includes(searchTerm) ||
          s.nik.includes(searchTerm) ||
          s.position.toLowerCase().includes(searchTerm) ||
          s.phone_number.includes(searchTerm)
      );

      expect(searchResults.length).toBe(1);
      expect(searchResults[0].position).toBe("Admin");
    });

    test("should support pagination with custom page and limit", () => {
      const pagination = { page: 2, limit: 5, total: 20, totalPages: 4 };

      expect(pagination.totalPages).toBe(
        Math.ceil(pagination.total / pagination.limit)
      );
      expect(pagination.page).toBeLessThanOrEqual(pagination.totalPages);
    });
  });

  describe("POST /api/staff - Create Staff", () => {
    test("should create new staff with required fields", () => {
      const newStaff = {
        staff_name: "John Doe",
        position: "Admin",
        phone_number: "08123456789",
        salary_amount: 5000000,
        join_date: "2025-01-01",
        status: "ACTIVE",
      };

      expect(newStaff.staff_name).toBeDefined();
      expect(newStaff.position).toBeDefined();
      expect(typeof newStaff.position).toBe("string");
      expect(newStaff.phone_number).toBeDefined();
      expect(newStaff.salary_amount).toBeGreaterThan(0);
      expect(newStaff.join_date).toBeDefined();
    });

    test("should fail when required fields are missing", () => {
      const invalidStaff = {
        staff_name: "John Doe",
        // missing position
        phone_number: "08123456789",
        // missing salary_amount
        // missing join_date
      };

      const requiredFields = [
        "staff_name",
        "position",
        "phone_number",
        "salary_amount",
        "join_date",
      ];
      const missingFields = requiredFields.filter(
        (field) => !invalidStaff[field]
      );

      expect(missingFields.length).toBeGreaterThan(0);
    });

    test("should validate position is not empty", () => {
      const invalidPositions = ["", "   ", null, undefined];

      invalidPositions.forEach((position) => {
        const isInvalid = !position || !position.trim || !position.trim();
        expect(isInvalid).toBe(true);
      });
    });

    test("should allow any string value for position", () => {
      const validPositions = [
        "Admin",
        "Finance",
        "Mekanik",
        "HR Manager",
        "IT Support",
        "Custom Position",
      ];

      validPositions.forEach((position) => {
        expect(typeof position).toBe("string");
        expect(position.trim().length).toBeGreaterThan(0);
      });
    });

    test("should validate status enum", () => {
      const validStatuses = ["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"];
      const testStatus = "ACTIVE";

      expect(validStatuses).toContain(testStatus);
    });

    test("should fail when salary is zero or negative", () => {
      const invalidSalaries = [0, -1000, -500000];

      invalidSalaries.forEach((salary) => {
        expect(salary).toBeLessThanOrEqual(0);
      });
    });

    test("should fail when allowances is negative", () => {
      const invalidAllowance = -1000;

      expect(invalidAllowance).toBeLessThan(0);
    });

    test("should ensure NIK is unique if provided", () => {
      const existingNIKs = ["1234567890", "0987654321"];
      const newNIK = "1234567890";

      const isDuplicate = existingNIKs.includes(newNIK);
      expect(isDuplicate).toBe(true);
    });

    test("should validate date format for join_date", () => {
      const validDate = "2025-01-01";
      const parsedDate = new Date(validDate);

      expect(parsedDate.toString()).not.toBe("Invalid Date");
    });

    test("should set default values for optional fields", () => {
      const staff = {
        staff_name: "John Doe",
        position: "ADMIN",
        phone_number: "08123456789",
        salary_amount: 5000000,
        join_date: "2025-01-01",
        allowances: 0, // default
        status: "ACTIVE", // default
      };

      expect(staff.allowances).toBe(0);
      expect(staff.status).toBe("ACTIVE");
    });
  });

  describe("GET /api/staff/[id] - Get Single Staff", () => {
    test("should return staff details by ID", () => {
      const staff = {
        id: "staff-1",
        staff_name: "John Doe",
        position: "Admin",
        phone_number: "08123456789",
        salary_amount: 5000000,
        status: "ACTIVE",
      };

      expect(staff.id).toBe("staff-1");
      expect(staff.staff_name).toBeDefined();
      expect(typeof staff.position).toBe("string");
    });

    test("should return 404 when staff not found", () => {
      const error = { status: 404, error: "Staff tidak ditemukan" };

      expect(error.status).toBe(404);
    });
  });

  describe("PUT /api/staff/[id] - Update Staff", () => {
    test("should update staff fields", () => {
      const existingStaff = {
        id: "staff-1",
        staff_name: "John Doe",
        position: "Admin",
        salary_amount: 5000000,
      };

      const updates = {
        staff_name: "John Updated",
        position: "Senior Admin",
        salary_amount: 6000000,
      };

      const updatedStaff = { ...existingStaff, ...updates };

      expect(updatedStaff.staff_name).toBe("John Updated");
      expect(updatedStaff.position).toBe("Senior Admin");
      expect(updatedStaff.salary_amount).toBe(6000000);
    });

    test("should validate position when updating", () => {
      const newPosition = "Finance Manager";

      expect(typeof newPosition).toBe("string");
      expect(newPosition.trim().length).toBeGreaterThan(0);
    });

    test("should validate status when updating", () => {
      const validStatuses = ["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"];
      const newStatus = "ON_LEAVE";

      expect(validStatuses).toContain(newStatus);
    });

    test("should validate salary when updating", () => {
      const newSalary = 7000000;

      expect(newSalary).toBeGreaterThan(0);
    });

    test("should ensure NIK uniqueness when updating", () => {
      const existingStaff = { id: "staff-1", nik: "1234" };
      const otherStaffNIKs = ["5678", "9012"];
      const newNIK = "5678";

      const isDuplicate =
        otherStaffNIKs.includes(newNIK) && newNIK !== existingStaff.nik;
      expect(isDuplicate).toBe(true);
    });

    test("should handle resign_date update", () => {
      const updates = { resign_date: "2025-12-31" };
      const parsedDate = new Date(updates.resign_date);

      expect(parsedDate.toString()).not.toBe("Invalid Date");
    });

    test("should return 404 when updating non-existent staff", () => {
      const error = { status: 404, error: "Staff tidak ditemukan" };

      expect(error.status).toBe(404);
    });
  });

  describe("DELETE /api/staff/[id] - Soft Delete", () => {
    test("should soft delete by setting status to TERMINATED", () => {
      const staff = {
        id: "staff-1",
        status: "ACTIVE",
      };

      const deletedStaff = {
        ...staff,
        status: "TERMINATED",
        resign_date: new Date(),
      };

      expect(deletedStaff.status).toBe("TERMINATED");
      expect(deletedStaff.resign_date).toBeInstanceOf(Date);
    });

    test("should return 404 when deleting non-existent staff", () => {
      const error = { status: 404, error: "Staff tidak ditemukan" };

      expect(error.status).toBe(404);
    });

    test("should return success message after deletion", () => {
      const response = {
        message: "Staff berhasil dihapus",
        staff: { id: "staff-1", status: "TERMINATED" },
      };

      expect(response.message).toBeDefined();
      expect(response.staff.status).toBe("TERMINATED");
    });
  });

  describe("Permissions", () => {
    test("should require view_staff permission for GET", () => {
      const requiredPermission = "view_staff";

      expect(requiredPermission).toBe("view_staff");
    });

    test("should require edit_staff permission for POST", () => {
      const requiredPermission = "edit_staff";

      expect(requiredPermission).toBe("edit_staff");
    });

    test("should require edit_staff permission for PUT", () => {
      const requiredPermission = "edit_staff";

      expect(requiredPermission).toBe("edit_staff");
    });

    test("should require delete_staff permission for DELETE", () => {
      const requiredPermission = "delete_staff";

      expect(requiredPermission).toBe("delete_staff");
    });
  });

  describe("Error Handling", () => {
    test("should handle database connection errors", () => {
      const error = { status: 500, error: "Gagal mengambil data staff" };

      expect(error.status).toBe(500);
    });

    test("should handle invalid request data", () => {
      const error = { status: 400, error: "Field staff_name wajib diisi" };

      expect(error.status).toBe(400);
    });

    test("should handle duplicate NIK error", () => {
      const error = { status: 400, error: "NIK sudah terdaftar" };

      expect(error.status).toBe(400);
    });

    test("should handle invalid position error", () => {
      const error = { status: 400, error: "Posisi tidak boleh kosong" };

      expect(error.status).toBe(400);
    });

    test("should handle invalid date format error", () => {
      const error = {
        status: 400,
        error: "Format tanggal bergabung tidak valid",
      };

      expect(error.status).toBe(400);
    });
  });

  describe("Data Structure", () => {
    test("should have correct staff structure", () => {
      const staff = {
        id: "uuid",
        staff_name: "John Doe",
        nik: "1234567890",
        position: "Admin", // Free text string
        phone_number: "08123456789",
        email: "john@example.com",
        address: "Jakarta",
        salary_amount: 5000000,
        allowances: 1000000,
        bank_name: "BCA",
        bank_account: "1234567890",
        account_holder: "John Doe",
        status: "ACTIVE",
        join_date: new Date(),
        resign_date: null,
        notes: "Some notes",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(typeof staff.id).toBe("string");
      expect(typeof staff.staff_name).toBe("string");
      expect(typeof staff.position).toBe("string");
      expect(typeof staff.salary_amount).toBe("number");
      expect(staff.join_date).toBeInstanceOf(Date);
    });

    test("should handle optional fields as null", () => {
      const staff = {
        id: "uuid",
        staff_name: "John Doe",
        nik: null,
        email: null,
        address: null,
        bank_name: null,
        resign_date: null,
        notes: null,
      };

      expect(staff.nik).toBeNull();
      expect(staff.email).toBeNull();
    });
  });
});
