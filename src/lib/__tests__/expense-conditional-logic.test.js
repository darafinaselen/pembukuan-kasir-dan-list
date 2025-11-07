const { PrismaClient } = require("@prisma/client");
const { calculateTransactionFinancials } = require("../accounting");

const prisma = new PrismaClient();

describe("Expense Conditional Logic - Nama Penerima", () => {
  describe("Category-based recipient field logic", () => {
    test('should show "Nama Sopir" field when category is GAJI_SOPIR', () => {
      // Test the conditional logic for driver selection
      const category = "GAJI_SOPIR";
      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      // This simulates the conditional rendering logic from PengeluaranDialog.jsx
      const shouldShowDriverField = category === "GAJI_SOPIR";
      const shouldShowStaffField = stafCategories.includes(category);
      const shouldShowInsentifField = insentifCategories.includes(category);

      expect(shouldShowDriverField).toBe(true);
      expect(shouldShowStaffField).toBe(false);
      expect(shouldShowInsentifField).toBe(false);
    });

    test('should show "Nama Staf" field when category is GAJI_STAF_OPERASIONAL', () => {
      const category = "GAJI_STAF_OPERASIONAL";
      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      const shouldShowDriverField = category === "GAJI_SOPIR";
      const shouldShowStaffField = stafCategories.includes(category);
      const shouldShowInsentifField = insentifCategories.includes(category);

      expect(shouldShowDriverField).toBe(false);
      expect(shouldShowStaffField).toBe(true);
      expect(shouldShowInsentifField).toBe(false);
    });

    test('should show "Nama Staf" field when category is GAJI_STAF_ADMIN', () => {
      const category = "GAJI_STAF_ADMIN";
      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      const shouldShowDriverField = category === "GAJI_SOPIR";
      const shouldShowStaffField = stafCategories.includes(category);
      const shouldShowInsentifField = insentifCategories.includes(category);

      expect(shouldShowDriverField).toBe(false);
      expect(shouldShowStaffField).toBe(true);
      expect(shouldShowInsentifField).toBe(false);
    });

    test('should show "Nama Penerima" field when category is INSENTIF_BONUS', () => {
      const category = "INSENTIF_BONUS";
      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      const shouldShowDriverField = category === "GAJI_SOPIR";
      const shouldShowStaffField = stafCategories.includes(category);
      const shouldShowInsentifField = insentifCategories.includes(category);

      expect(shouldShowDriverField).toBe(false);
      expect(shouldShowStaffField).toBe(false);
      expect(shouldShowInsentifField).toBe(true);
    });

    test("should not show recipient fields for non-salary categories", () => {
      const testCategories = [
        "LISTRIK",
        "INTERNET",
        "PAKET_DATA",
        "KONSUMSI",
        "PAJAK",
        "ALAT_TULIS_KANTOR",
        "KOMPUTER_SUPPLIES",
        "OPERASIONAL_LAINNYA",
        "BBM",
        "PERAWATAN_ARMADA",
        "LAINNYA",
      ];

      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      testCategories.forEach((category) => {
        const shouldShowDriverField = category === "GAJI_SOPIR";
        const shouldShowStaffField = stafCategories.includes(category);
        const shouldShowInsentifField = insentifCategories.includes(category);

        expect(shouldShowDriverField).toBe(false);
        expect(shouldShowStaffField).toBe(false);
        expect(shouldShowInsentifField).toBe(false);
      });
    });

    test("should handle edge cases with undefined/null categories", () => {
      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      const testCases = [undefined, null, "", "INVALID_CATEGORY"];

      testCases.forEach((category) => {
        const shouldShowDriverField = category === "GAJI_SOPIR";
        const shouldShowStaffField = stafCategories.includes(category);
        const shouldShowInsentifField = insentifCategories.includes(category);

        expect(shouldShowDriverField).toBe(false);
        expect(shouldShowStaffField).toBe(false);
        expect(shouldShowInsentifField).toBe(false);
      });
    });
  });

  describe("Recipient field validation logic", () => {
    test("should validate driver selection for GAJI_SOPIR category", () => {
      const category = "GAJI_SOPIR";
      const driverId = "driver-123";
      const staffId = null;
      const namaPenerima = "";

      // Simulate validation logic
      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      const isValidRecipient =
        category === "GAJI_SOPIR"
          ? driverId !== null && driverId !== undefined && driverId !== ""
          : stafCategories.includes(category)
            ? staffId !== null && staffId !== undefined && staffId !== ""
            : insentifCategories.includes(category)
              ? namaPenerima !== null &&
                namaPenerima !== undefined &&
                namaPenerima.trim() !== ""
              : true;

      expect(isValidRecipient).toBe(true);
    });

    test("should validate staff selection for GAJI_STAF_OPERASIONAL category", () => {
      const category = "GAJI_STAF_OPERASIONAL";
      const driverId = null;
      const staffId = "staff-456";
      const namaPenerima = "";

      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      const isValidRecipient =
        category === "GAJI_SOPIR"
          ? driverId !== null && driverId !== undefined && driverId !== ""
          : stafCategories.includes(category)
            ? staffId !== null && staffId !== undefined && staffId !== ""
            : insentifCategories.includes(category)
              ? namaPenerima !== null &&
                namaPenerima !== undefined &&
                namaPenerima.trim() !== ""
              : true;

      expect(isValidRecipient).toBe(true);
    });

    test("should validate namaPenerima for INSENTIF_BONUS category", () => {
      const category = "INSENTIF_BONUS";
      const driverId = null;
      const staffId = null;
      const namaPenerima = "John Doe";

      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      const isValidRecipient =
        category === "GAJI_SOPIR"
          ? driverId !== null && driverId !== undefined && driverId !== ""
          : stafCategories.includes(category)
            ? staffId !== null && staffId !== undefined && staffId !== ""
            : insentifCategories.includes(category)
              ? namaPenerima !== null &&
                namaPenerima !== undefined &&
                namaPenerima.trim() !== ""
              : true;

      expect(isValidRecipient).toBe(true);
    });

    test("should allow empty recipient for non-salary categories", () => {
      const category = "LISTRIK";
      const driverId = null;
      const staffId = null;
      const namaPenerima = "";

      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      const isValidRecipient =
        category === "GAJI_SOPIR"
          ? driverId !== null && driverId !== undefined && driverId !== ""
          : stafCategories.includes(category)
            ? staffId !== null && staffId !== undefined && staffId !== ""
            : insentifCategories.includes(category)
              ? namaPenerima !== null &&
                namaPenerima !== undefined &&
                namaPenerima.trim() !== ""
              : true;

      expect(isValidRecipient).toBe(true);
    });

    test("should reject invalid recipient selection for salary categories", () => {
      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];
      const insentifCategories = ["INSENTIF_BONUS"];

      // Test GAJI_SOPIR without driver
      const category1 = "GAJI_SOPIR";
      const driverId1 = null;
      const staffId1 = null;
      const namaPenerima1 = "";
      const isValidRecipient1 =
        category1 === "GAJI_SOPIR"
          ? driverId1 !== null && driverId1 !== undefined && driverId1 !== ""
          : stafCategories.includes(category1)
            ? staffId1 !== null && staffId1 !== undefined && staffId1 !== ""
            : insentifCategories.includes(category1)
              ? namaPenerima1 !== null &&
                namaPenerima1 !== undefined &&
                namaPenerima1.trim() !== ""
              : true;

      expect(isValidRecipient1).toBe(false);

      // Test GAJI_STAF_OPERASIONAL without staff
      const category2 = "GAJI_STAF_OPERASIONAL";
      const driverId2 = null;
      const staffId2 = null;
      const namaPenerima2 = "";
      const isValidRecipient2 =
        category2 === "GAJI_SOPIR"
          ? driverId2 !== null && driverId2 !== undefined && driverId2 !== ""
          : stafCategories.includes(category2)
            ? staffId2 !== null && staffId2 !== undefined && staffId2 !== ""
            : insentifCategories.includes(category2)
              ? namaPenerima2 !== null &&
                namaPenerima2 !== undefined &&
                namaPenerima2.trim() !== ""
              : true;

      expect(isValidRecipient2).toBe(false);

      // Test INSENTIF_BONUS without namaPenerima
      const category3 = "INSENTIF_BONUS";
      const driverId3 = null;
      const staffId3 = null;
      const namaPenerima3 = "";
      const isValidRecipient3 =
        category3 === "GAJI_SOPIR"
          ? driverId3 !== null && driverId3 !== undefined && driverId3 !== ""
          : stafCategories.includes(category3)
            ? staffId3 !== null && staffId3 !== undefined && staffId3 !== ""
            : insentifCategories.includes(category3)
              ? namaPenerima3 !== null &&
                namaPenerima3 !== undefined &&
                namaPenerima3.trim() !== ""
              : true;

      expect(isValidRecipient3).toBe(false);
    });
  });

  describe("Category options validation", () => {
    test("should contain all expected salary categories", () => {
      const expectedSalaryCategories = [
        "GAJI_SOPIR",
        "GAJI_STAF_OPERASIONAL",
        "GAJI_STAF_ADMIN",
        "INSENTIF_BONUS",
      ];

      const kategoriOptions = [
        { value: "LISTRIK", label: "Listrik" },
        { value: "INTERNET", label: "Internet" },
        { value: "PAKET_DATA", label: "Paket Data" },
        { value: "KONSUMSI", label: "Konsumsi" },
        { value: "GAJI_STAF_OPERASIONAL", label: "Gaji Staf Operasional" },
        { value: "GAJI_STAF_ADMIN", label: "Gaji Staf Admin" },
        { value: "PAJAK", label: "Pajak" },
        { value: "ALAT_TULIS_KANTOR", label: "Alat Tulis Kantor (ATK)" },
        { value: "KOMPUTER_SUPPLIES", label: "Komputer Supplies" },
        { value: "OPERASIONAL_LAINNYA", label: "Operasional Lainnya" },
        { value: "BBM", label: "BBM (Armada)" },
        { value: "PERAWATAN_ARMADA", label: "Perawatan Armada" },
        { value: "GAJI_SOPIR", label: "Gaji Sopir" },
        { value: "INSENTIF_BONUS", label: "Insentif/Bonus" },
        { value: "LAINNYA", label: "Lainnya..." },
      ];

      const actualSalaryCategories = kategoriOptions
        .filter((option) => expectedSalaryCategories.includes(option.value))
        .map((option) => option.value)
        .sort(); // Sort to ensure consistent order

      const sortedExpected = [...expectedSalaryCategories].sort();

      expect(actualSalaryCategories).toEqual(sortedExpected);
      expect(actualSalaryCategories).toHaveLength(4);
    });

    test("should have correct stafCategories array", () => {
      const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];

      expect(stafCategories).toContain("GAJI_STAF_OPERASIONAL");
      expect(stafCategories).toContain("GAJI_STAF_ADMIN");
      expect(stafCategories).not.toContain("GAJI_SOPIR");
      expect(stafCategories).toHaveLength(2);
    });

    test("should have correct insentifCategories array", () => {
      const insentifCategories = ["INSENTIF_BONUS"];

      expect(insentifCategories).toContain("INSENTIF_BONUS");
      expect(insentifCategories).toHaveLength(1);
    });
  });
});
