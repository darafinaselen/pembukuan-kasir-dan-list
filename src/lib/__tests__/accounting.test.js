/**
 * Unit Tests for Accounting Logic
 * Tests all financial calculation functions for accuracy and edge cases
 */

import { describe, it, expect } from "@jest/globals";
import {
  calculateTransactionFinancials,
  calculateAggregateFinancials,
  calculateNetProfit,
  validateTransactionFinancials,
  formatCurrency,
  formatCurrencyCompact,
} from "../accounting";

describe("calculateTransactionFinancials", () => {
  describe("Normal transactions without overtime", () => {
    it("should calculate correctly for 12-hour rental without overtime", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(12);
      expect(result.lamaOvertimeJam).toBe(0);
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(500000);
      expect(result.totalBiayaOps).toBe(250000);
      expect(result.labaKotor).toBe(250000);
    });

    it("should use default 12 hours when package is not provided", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        // No package
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(12);
      expect(result.lamaOvertimeJam).toBe(0);
      expect(result.totalOvertimeFee).toBe(0);
    });
  });

  describe("Transactions with overtime", () => {
    it("should calculate correctly with 3 hours overtime", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z", // 15 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(15);
      expect(result.lamaOvertimeJam).toBe(3);
      expect(result.totalOvertimeFee).toBe(150000); // 3 * 50000
      expect(result.totalPendapatan).toBe(650000); // 500000 + 150000
      expect(result.totalBiayaOps).toBe(250000);
      expect(result.labaKotor).toBe(400000); // 650000 - 250000
    });

    it("should calculate correctly with 1 hour overtime", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T21:00:00Z", // 13 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(13);
      expect(result.lamaOvertimeJam).toBe(1);
      expect(result.totalOvertimeFee).toBe(50000);
      expect(result.totalPendapatan).toBe(550000);
      expect(result.labaKotor).toBe(300000);
    });

    it("should handle large overtime correctly", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-02T08:00:00Z", // 24 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(24);
      expect(result.lamaOvertimeJam).toBe(12);
      expect(result.totalOvertimeFee).toBe(600000); // 12 * 50000
      expect(result.totalPendapatan).toBe(1100000); // 500000 + 600000
    });
  });

  describe("Edge cases", () => {
    it("should handle invalid time range (checkin before checkout)", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T20:00:00Z",
        checkin_datetime: "2025-11-01T08:00:00Z", // Before checkout!
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(0);
      expect(result.lamaOvertimeJam).toBe(0);
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(500000); // Only base rate
      expect(result.labaKotor).toBe(250000);
    });

    it("should handle zero overtime rate", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 0, // Zero rate
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaOvertimeJam).toBe(3);
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(500000);
    });

    it("should handle missing/null values gracefully", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        // Missing overtime_rate_per_hour
        // Missing fuel_cost
        // Missing driver_fee
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.totalPendapatan).toBe(500000);
      expect(result.totalBiayaOps).toBe(0);
      expect(result.labaKotor).toBe(500000);
    });

    it("should handle zero costs", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 0,
        driver_fee: 0,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.totalBiayaOps).toBe(0);
      expect(result.labaKotor).toBe(500000); // Full profit
    });

    it("should handle negative profit (loss)", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 200000, // Low rate
        overtime_rate_per_hour: 50000,
        fuel_cost: 150000,
        driver_fee: 200000, // High costs
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.totalPendapatan).toBe(200000);
      expect(result.totalBiayaOps).toBe(350000);
      expect(result.labaKotor).toBe(-150000); // Loss!
    });
  });

  describe("Rounding behavior", () => {
    it("should round hours correctly for 12.4 hours", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:24:00Z", // 12.4 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(12); // Rounded
      expect(result.lamaOvertimeJam).toBe(0);
    });

    it("should round hours correctly for 12.6 hours", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:36:00Z", // 12.6 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(13); // Rounded up
      expect(result.lamaOvertimeJam).toBe(1);
      expect(result.totalOvertimeFee).toBe(50000);
    });
  });
});

describe("calculateAggregateFinancials", () => {
  it("should aggregate multiple transactions correctly", () => {
    const transactions = [
      {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      },
      {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z", // With overtime
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      },
    ];

    const result = calculateAggregateFinancials(transactions);

    expect(result.totalRevenue).toBe(1150000); // 500k + 650k
    expect(result.totalOperationalCosts).toBe(500000); // 250k + 250k
    expect(result.totalGrossProfit).toBe(650000); // 250k + 400k
    expect(result.totalOvertimeFees).toBe(150000); // 0 + 150k
    expect(result.transactionCount).toBe(2);
    expect(result.averageRevenue).toBe(575000); // 1150k / 2
    expect(result.averageProfit).toBe(325000); // 650k / 2
  });

  it("should handle empty array", () => {
    const result = calculateAggregateFinancials([]);

    expect(result.totalRevenue).toBe(0);
    expect(result.totalOperationalCosts).toBe(0);
    expect(result.totalGrossProfit).toBe(0);
    expect(result.transactionCount).toBe(0);
    expect(result.averageRevenue).toBe(0);
    expect(result.averageProfit).toBe(0);
  });

  it("should handle single transaction", () => {
    const transactions = [
      {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      },
    ];

    const result = calculateAggregateFinancials(transactions);

    expect(result.transactionCount).toBe(1);
    expect(result.averageRevenue).toBe(500000);
    expect(result.averageProfit).toBe(250000);
  });
});

describe("calculateNetProfit", () => {
  it("should calculate net profit correctly", () => {
    const result = calculateNetProfit(1000000, 300000);

    expect(result.grossProfit).toBe(1000000);
    expect(result.officeExpenses).toBe(300000);
    expect(result.netProfit).toBe(700000);
    expect(result.profitMargin).toBe(70); // 70%
  });

  it("should handle zero gross profit", () => {
    const result = calculateNetProfit(0, 300000);

    expect(result.netProfit).toBe(-300000); // Loss
    expect(result.profitMargin).toBe(0);
  });

  it("should handle zero expenses", () => {
    const result = calculateNetProfit(1000000, 0);

    expect(result.netProfit).toBe(1000000);
    expect(result.profitMargin).toBe(100); // 100% profit
  });

  it("should handle negative net profit", () => {
    const result = calculateNetProfit(500000, 800000);

    expect(result.netProfit).toBe(-300000); // Loss
    expect(result.profitMargin).toBeLessThan(0);
  });
});

describe("validateTransactionFinancials", () => {
  it("should validate correct transaction", () => {
    const transaction = {
      checkout_datetime: "2025-11-01T08:00:00Z",
      checkin_datetime: "2025-11-01T20:00:00Z",
      all_in_rate: 500000,
      overtime_rate_per_hour: 50000,
      fuel_cost: 100000,
      driver_fee: 150000,
    };

    const result = validateTransactionFinancials(transaction);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should catch invalid time range", () => {
    const transaction = {
      checkout_datetime: "2025-11-01T20:00:00Z",
      checkin_datetime: "2025-11-01T08:00:00Z", // Before checkout
      all_in_rate: 500000,
      overtime_rate_per_hour: 50000,
      fuel_cost: 100000,
      driver_fee: 150000,
    };

    const result = validateTransactionFinancials(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Check-in time must be after check-out time"
    );
  });

  it("should catch negative all_in_rate", () => {
    const transaction = {
      checkout_datetime: "2025-11-01T08:00:00Z",
      checkin_datetime: "2025-11-01T20:00:00Z",
      all_in_rate: -500000, // Negative!
      overtime_rate_per_hour: 50000,
      fuel_cost: 100000,
      driver_fee: 150000,
    };

    const result = validateTransactionFinancials(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("All-in rate cannot be negative");
  });

  it("should catch negative overtime_rate_per_hour", () => {
    const transaction = {
      checkout_datetime: "2025-11-01T08:00:00Z",
      checkin_datetime: "2025-11-01T20:00:00Z",
      all_in_rate: 500000,
      overtime_rate_per_hour: -50000, // Negative!
      fuel_cost: 100000,
      driver_fee: 150000,
    };

    const result = validateTransactionFinancials(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Overtime rate cannot be negative");
  });

  it("should catch multiple validation errors", () => {
    const transaction = {
      checkout_datetime: "2025-11-01T20:00:00Z",
      checkin_datetime: "2025-11-01T08:00:00Z", // Invalid time
      all_in_rate: -500000, // Negative
      overtime_rate_per_hour: -50000, // Negative
      fuel_cost: -100000, // Negative
      driver_fee: -150000, // Negative
    };

    const result = validateTransactionFinancials(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe("formatCurrency", () => {
  it("should format currency correctly", () => {
    const formatted500k = formatCurrency(500000);
    const formatted1_5m = formatCurrency(1500000);
    const formatted0 = formatCurrency(0);

    // Check that it contains "Rp" and proper formatting
    expect(formatted500k).toContain("Rp");
    expect(formatted500k).toContain("500");

    expect(formatted1_5m).toContain("Rp");
    expect(formatted1_5m).toContain("1");
    expect(formatted1_5m).toContain("500");

    expect(formatted0).toContain("Rp");
    expect(formatted0).toContain("0");
  });

  it("should handle invalid inputs", () => {
    expect(formatCurrency(null)).toBe("Rp 0");
    expect(formatCurrency(undefined)).toBe("Rp 0");
    expect(formatCurrency(NaN)).toBe("Rp 0");
  });

  it("should format negative numbers", () => {
    const formatted = formatCurrency(-500000);
    expect(formatted).toContain("500");
    expect(formatted).toMatch(/[-−]/); // Either minus or negative sign
  });

  it("should format large numbers", () => {
    const formatted = formatCurrency(1000000000);
    expect(formatted).toContain("Rp");
    expect(formatted).toContain("1");
    expect(formatted).toContain("000");
  });
});

describe("formatCurrencyCompact", () => {
  it("should format small numbers normally", () => {
    const formatted = formatCurrencyCompact(500000);
    expect(formatted).toContain("Rp");
    expect(formatted).toMatch(/500|rb/i);
  });

  it("should format millions compactly", () => {
    const formatted = formatCurrencyCompact(1500000);
    expect(formatted).toContain("Rp");
    // Should show compact notation (jt or juta)
    expect(formatted).toMatch(/[1-2]/); // 1.5 or 2
    expect(formatted).toMatch(/jt|juta|M/i);
  });

  it("should format billions compactly", () => {
    const formatted = formatCurrencyCompact(1500000000);
    expect(formatted).toContain("Rp");
    expect(formatted).toMatch(/[1-2]/);
    expect(formatted).toMatch(/M|miliar|B/i);
  });

  it("should handle zero", () => {
    const formatted = formatCurrencyCompact(0);
    expect(formatted).toContain("Rp");
    expect(formatted).toContain("0");
  });
});

describe("Integration tests - Real world scenarios", () => {
  it("should calculate daily revenue correctly", () => {
    // Scenario: 5 transactions in a day
    const dailyTransactions = [
      {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      },
      {
        checkout_datetime: "2025-11-01T09:00:00Z",
        checkin_datetime: "2025-11-01T22:00:00Z", // 1 hour OT
        all_in_rate: 600000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 120000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      },
      {
        checkout_datetime: "2025-11-01T10:00:00Z",
        checkin_datetime: "2025-11-02T01:00:00Z", // 3 hours OT
        all_in_rate: 700000,
        overtime_rate_per_hour: 60000,
        fuel_cost: 150000,
        driver_fee: 200000,
        package: { durationHours: 12 },
      },
      {
        checkout_datetime: "2025-11-01T14:00:00Z",
        checkin_datetime: "2025-11-02T02:00:00Z", // No package = default 12h
        all_in_rate: 550000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 110000,
        driver_fee: 150000,
      },
      {
        checkout_datetime: "2025-11-01T16:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z", // Exactly 7 hours, no OT
        all_in_rate: 400000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 80000,
        driver_fee: 120000,
        package: { durationHours: 8 },
      },
    ];

    const result = calculateAggregateFinancials(dailyTransactions);

    // Verify totals
    expect(result.transactionCount).toBe(5);
    expect(result.totalRevenue).toBeGreaterThan(2750000); // Has overtime
    expect(result.totalGrossProfit).toBeGreaterThan(0);
    expect(result.averageRevenue).toBeGreaterThan(500000);
  });

  it("should handle month-end profit calculation", () => {
    // Gross profit from transactions
    const grossProfit = 50000000; // 50 million

    // Office expenses
    const officeExpenses = 15000000; // 15 million

    const result = calculateNetProfit(grossProfit, officeExpenses);

    expect(result.netProfit).toBe(35000000); // 35 million
    expect(result.profitMargin).toBe(70); // 70% margin
  });
});
