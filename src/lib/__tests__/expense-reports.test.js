/**
 * Unit Tests for Expense Reports - Grouping/Pivot Functionality
 * Tests the expense grouping logic for category and month-based reports
 */

import { describe, it, expect } from "@jest/globals";

// Test data for expense grouping
const mockExpenses = [
  {
    id: "exp-1",
    date: new Date("2025-11-01"),
    paymentMonth: new Date("2025-11-01"),
    category: "BBM",
    description: "Bensin Armada Toyota Avanza",
    amount: 500000,
    armada: {
      id: "arm-1",
      license_plate: "B 1234 ABC",
      brand: "Toyota",
      model: "Avanza",
    },
    driver: null,
    staff: null,
    attachments: [],
  },
  {
    id: "exp-2",
    date: new Date("2025-11-01"),
    paymentMonth: new Date("2025-11-01"),
    category: "GAJI_SOPIR",
    description: "Gaji Sopir Bulan November",
    amount: 2500000,
    armada: null,
    driver: { id: "drv-1", driver_name: "John Doe", nik: "123456789" },
    staff: null,
    attachments: [],
  },
  {
    id: "exp-3",
    date: new Date("2025-11-05"),
    paymentMonth: new Date("2025-11-01"),
    category: "BBM",
    description: "Bensin Armada Honda Jazz",
    amount: 400000,
    armada: {
      id: "arm-2",
      license_plate: "B 5678 DEF",
      brand: "Honda",
      model: "Jazz",
    },
    driver: null,
    staff: null,
    attachments: [],
  },
  {
    id: "exp-4",
    date: new Date("2025-11-15"),
    paymentMonth: new Date("2025-11-01"),
    category: "GAJI_STAF_ADMIN",
    description: "Gaji Admin Bulan November",
    amount: 1800000,
    armada: null,
    driver: null,
    staff: { id: "stf-1", name: "Jane Smith", position: "Admin" },
    attachments: [],
  },
  {
    id: "exp-5",
    date: new Date("2025-10-15"),
    paymentMonth: new Date("2025-10-01"),
    category: "BBM",
    description: "Bensin Bulan Oktober",
    amount: 600000,
    armada: null,
    driver: null,
    staff: null,
    attachments: [],
  },
];

// Helper function to group expenses by category
function groupExpensesByCategory(expenses) {
  return expenses.reduce((acc, expense) => {
    const categoryKey = expense.category;

    if (!acc[categoryKey]) {
      acc[categoryKey] = {
        category: categoryKey,
        totalAmount: 0,
        count: 0,
        expenses: [],
      };
    }

    acc[categoryKey].totalAmount += expense.amount;
    acc[categoryKey].count += 1;
    acc[categoryKey].expenses.push(expense);

    return acc;
  }, {});
}

// Helper function to group expenses by month
function groupExpensesByMonth(expenses) {
  return expenses.reduce((acc, expense) => {
    const monthKey = expense.date.toISOString().substring(0, 7); // YYYY-MM

    if (!acc[monthKey]) {
      acc[monthKey] = {
        period: monthKey,
        totalAmount: 0,
        categories: {},
        expenses: [],
      };
    }

    acc[monthKey].totalAmount += expense.amount;
    acc[monthKey].expenses.push(expense);

    // Also group by category within each month
    if (!acc[monthKey].categories[expense.category]) {
      acc[monthKey].categories[expense.category] = {
        category: expense.category,
        totalAmount: 0,
        count: 0,
        expenses: [],
      };
    }

    acc[monthKey].categories[expense.category].totalAmount += expense.amount;
    acc[monthKey].categories[expense.category].count += 1;
    acc[monthKey].categories[expense.category].expenses.push(expense);

    return acc;
  }, {});
}

describe("Expense Reports - Grouping Logic", () => {
  describe("Category-based Grouping", () => {
    it("should group expenses by category correctly", () => {
      const result = groupExpensesByCategory(mockExpenses);
      const categories = Object.values(result);

      expect(categories).toHaveLength(3); // BBM, GAJI_SOPIR, GAJI_STAF_ADMIN

      // Check BBM category grouping
      const bbmCategory = categories.find((item) => item.category === "BBM");
      expect(bbmCategory).toBeDefined();
      expect(bbmCategory.totalAmount).toBe(500000 + 400000 + 600000); // 1500000
      expect(bbmCategory.count).toBe(3);
      expect(bbmCategory.expenses).toHaveLength(3);

      // Check GAJI_SOPIR category grouping
      const gajiSopirCategory = categories.find(
        (item) => item.category === "GAJI_SOPIR"
      );
      expect(gajiSopirCategory).toBeDefined();
      expect(gajiSopirCategory.totalAmount).toBe(2500000);
      expect(gajiSopirCategory.count).toBe(1);
      expect(gajiSopirCategory.expenses).toHaveLength(1);
    });

    it("should calculate correct totals for each category", () => {
      const result = groupExpensesByCategory(mockExpenses);

      expect(result.BBM.totalAmount).toBe(1500000);
      expect(result.GAJI_SOPIR.totalAmount).toBe(2500000);
      expect(result.GAJI_STAF_ADMIN.totalAmount).toBe(1800000);
    });
  });

  describe("Month-based Grouping", () => {
    it("should group expenses by month with category breakdown", () => {
      const result = groupExpensesByMonth(mockExpenses);
      const months = Object.values(result);

      expect(months).toHaveLength(2); // November and October

      // Check November 2025 grouping
      const novemberData = months.find((item) => item.period === "2025-11");
      expect(novemberData).toBeDefined();
      expect(novemberData.totalAmount).toBe(
        500000 + 2500000 + 400000 + 1800000
      ); // 5200000
      expect(novemberData.expenses).toHaveLength(4);

      // Check categories within November
      expect(novemberData.categories.BBM.totalAmount).toBe(500000 + 400000); // 900000
      expect(novemberData.categories.GAJI_SOPIR.totalAmount).toBe(2500000);
      expect(novemberData.categories.GAJI_STAF_ADMIN.totalAmount).toBe(1800000);
    });
  });
});
