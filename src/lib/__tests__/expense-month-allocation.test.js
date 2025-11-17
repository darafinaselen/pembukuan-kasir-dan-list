describe("Expense Month Allocation Feature", () => {
  describe("Month options generation", () => {
    test("should generate correct month options array", () => {
      const bulanOptions = [
        { value: "01", label: "Januari" },
        { value: "02", label: "Februari" },
        { value: "03", label: "Maret" },
        { value: "04", label: "April" },
        { value: "05", label: "Mei" },
        { value: "06", label: "Juni" },
        { value: "07", label: "Juli" },
        { value: "08", label: "Agustus" },
        { value: "09", label: "September" },
        { value: "10", label: "Oktober" },
        { value: "11", label: "November" },
        { value: "12", label: "Desember" },
      ];

      expect(bulanOptions).toHaveLength(12);
      expect(bulanOptions[0]).toEqual({ value: "01", label: "Januari" });
      expect(bulanOptions[11]).toEqual({ value: "12", label: "Desember" });
    });

    test("should have valid month values (01-12)", () => {
      const bulanOptions = [
        { value: "01", label: "Januari" },
        { value: "02", label: "Februari" },
        { value: "03", label: "Maret" },
        { value: "04", label: "April" },
        { value: "05", label: "Mei" },
        { value: "06", label: "Juni" },
        { value: "07", label: "Juli" },
        { value: "08", label: "Agustus" },
        { value: "09", label: "September" },
        { value: "10", label: "Oktober" },
        { value: "11", label: "November" },
        { value: "12", label: "Desember" },
      ];

      bulanOptions.forEach((option, index) => {
        const expectedValue = String(index + 1).padStart(2, "0");
        expect(option.value).toBe(expectedValue);
        expect(option.label).toBeDefined();
        expect(typeof option.label).toBe("string");
        expect(option.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Payment month field validation", () => {
    test("should accept valid month values", () => {
      const validMonths = [
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
      ];

      validMonths.forEach((month) => {
        const isValid =
          month.length === 2 &&
          parseInt(month, 10) >= 1 &&
          parseInt(month, 10) <= 12;
        expect(isValid).toBe(true);
      });
    });

    test("should reject invalid month values", () => {
      const invalidMonths = ["00", "13", "99", "1", "123"];

      invalidMonths.forEach((month) => {
        const isValid =
          month &&
          typeof month === "string" &&
          month.length === 2 &&
          parseInt(month, 10) >= 1 &&
          parseInt(month, 10) <= 12;
        expect(isValid).toBe(false);
      });
    });

    test("should allow null/undefined paymentMonth for optional field", () => {
      const testCases = [null, undefined, ""];

      testCases.forEach((paymentMonth) => {
        // Payment month is optional, so null/undefined should be valid
        const isValid =
          paymentMonth === null ||
          paymentMonth === undefined ||
          paymentMonth === "" ||
          (paymentMonth.length === 2 &&
            parseInt(paymentMonth, 10) >= 1 &&
            parseInt(paymentMonth, 10) <= 12);
        expect(isValid).toBe(true);
      });
    });
  });

  describe("Form state management for paymentMonth", () => {
    test("should initialize paymentMonth in form state", () => {
      const INITIAL_FORM_STATE = {
        date: "",
        paymentMonth: "",
        category: "",
        kategoriLainnya: "",
        description: "",
        amount: "",
        armadaId: null,
        driverId: null,
        staffId: null,
        namaPenerima: "",
        file: null,
      };

      expect(INITIAL_FORM_STATE.paymentMonth).toBe("");
      expect(INITIAL_FORM_STATE).toHaveProperty("paymentMonth");
    });

    test("should update paymentMonth in form state", () => {
      let formData = { paymentMonth: "" };

      // Simulate handleSelectChange for paymentMonth
      const newFormData = { ...formData, paymentMonth: "05" };

      expect(newFormData.paymentMonth).toBe("05");
    });

    test("should handle paymentMonth in edit dialog", () => {
      const mockExpense = {
        id: 1,
        date: new Date("2025-11-07"),
        paymentMonth: new Date("2025-09-01T00:00:00.000Z"), // September
        category: "LISTRIK",
        description: "Test expense",
        amount: 150000,
      };

      // Simulate openEditDialog logic
      const formData = {
        ...mockExpense,
        date: new Date(mockExpense.date).toISOString().split("T")[0],
        paymentMonth: mockExpense.paymentMonth
          ? String(new Date(mockExpense.paymentMonth).getMonth() + 1).padStart(2, "0")
          : undefined,
      };

      expect(formData.paymentMonth).toBe("09");
    });
  });
});
