const {
  calculateOvertime,
  formatCurrency,
  formatDateTime,
} = require("../../lib/transaction-utils");

describe("Transaction Utils - Overtime Calculations", () => {
  describe("calculateOvertime", () => {
    test("should return zero overtime when checkin equals checkout", () => {
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T08:00:00Z");

      const result = calculateOvertime(checkout, checkin, 12, 50000);

      expect(result.overtimeHours).toBe(0);
      expect(result.overtimeCost).toBe(0);
      expect(result.totalDurationHours).toBe(0);
    });

    test("should return zero overtime when checkin is before checkout", () => {
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T06:00:00Z");

      const result = calculateOvertime(checkout, checkin, 12, 50000);

      expect(result.overtimeHours).toBe(0);
      expect(result.overtimeCost).toBe(0);
      expect(result.totalDurationHours).toBe(0);
    });

    test("should return zero overtime when duration equals package duration", () => {
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T20:00:00Z"); // Exactly 12 hours

      const result = calculateOvertime(checkout, checkin, 12, 50000);

      expect(result.overtimeHours).toBe(0);
      expect(result.overtimeCost).toBe(0);
      expect(result.totalDurationHours).toBe(12);
    });

    test("should calculate overtime when duration exceeds package duration", () => {
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T22:00:00Z"); // 14 hours total

      const result = calculateOvertime(checkout, checkin, 12, 50000);

      expect(result.overtimeHours).toBe(2);
      expect(result.overtimeCost).toBe(100000); // 2 hours * 50000
      expect(result.totalDurationHours).toBe(14);
    });

    test("should calculate overtime with fractional hours", () => {
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T21:30:00Z"); // 13.5 hours total

      const result = calculateOvertime(checkout, checkin, 12, 50000);

      expect(result.overtimeHours).toBe(1.5);
      expect(result.overtimeCost).toBe(75000); // 1.5 hours * 50000
      expect(result.totalDurationHours).toBe(13.5);
    });

    test("should handle overtime across midnight (next day)", () => {
      const checkout = new Date("2025-11-07T20:00:00Z"); // 8 PM
      const checkin = new Date("2025-11-08T04:00:00Z"); // 4 AM next day (8 hours later)

      const result = calculateOvertime(checkout, checkin, 12, 75000);

      expect(result.overtimeHours).toBe(0); // 8 hours < 12 hours package
      expect(result.overtimeCost).toBe(0);
      expect(result.totalDurationHours).toBe(8);
    });

    test("should calculate overtime across midnight with excess duration", () => {
      const checkout = new Date("2025-11-07T18:00:00Z"); // 6 PM
      const checkin = new Date("2025-11-08T10:00:00Z"); // 10 AM next day (16 hours later)

      const result = calculateOvertime(checkout, checkin, 12, 60000);

      expect(result.overtimeHours).toBe(4);
      expect(result.overtimeCost).toBe(240000); // 4 hours * 60000
      expect(result.totalDurationHours).toBe(16);
    });

    test("should handle very long overtime periods", () => {
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-08T08:00:00Z"); // Exactly 24 hours later

      const result = calculateOvertime(checkout, checkin, 12, 100000);

      expect(result.overtimeHours).toBe(12);
      expect(result.overtimeCost).toBe(1200000); // 12 hours * 100000
      expect(result.totalDurationHours).toBe(24);
    });

    test("should handle zero overtime rate", () => {
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T22:00:00Z");

      const result = calculateOvertime(checkout, checkin, 12, 0);

      expect(result.overtimeHours).toBe(2);
      expect(result.overtimeCost).toBe(0); // Cost is 0 even with overtime
      expect(result.totalDurationHours).toBe(14);
    });

    test("should handle string date inputs", () => {
      const checkout = "2025-11-07T08:00:00Z";
      const checkin = "2025-11-07T22:00:00Z";

      const result = calculateOvertime(checkout, checkin, 12, 50000);

      expect(result.overtimeHours).toBe(2);
      expect(result.overtimeCost).toBe(100000);
      expect(result.totalDurationHours).toBe(14);
    });

    test("should handle null/undefined inputs", () => {
      const result1 = calculateOvertime(
        null,
        "2025-11-07T22:00:00Z",
        12,
        50000
      );
      expect(result1.overtimeHours).toBe(0);

      const result2 = calculateOvertime(
        "2025-11-07T08:00:00Z",
        null,
        12,
        50000
      );
      expect(result2.overtimeHours).toBe(0);

      const result3 = calculateOvertime(null, null, 12, 50000);
      expect(result3.overtimeHours).toBe(0);
    });

    test("should use default package duration when not provided", () => {
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T22:00:00Z");

      const result = calculateOvertime(checkout, checkin, undefined, 50000);

      expect(result.overtimeHours).toBe(2); // 14 - 12 = 2
      expect(result.totalDurationHours).toBe(14);
    });

    test("should use default overtime rate when not provided", () => {
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T22:00:00Z");

      const result = calculateOvertime(checkout, checkin, 12, undefined);

      expect(result.overtimeHours).toBe(2);
      expect(result.overtimeCost).toBe(0); // 2 * 0 = 0
    });

    test("should round overtime cost to nearest integer", () => {
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T21:45:00Z"); // 13.75 hours

      const result = calculateOvertime(checkout, checkin, 12, 33333);

      expect(result.overtimeHours).toBe(1.75);
      expect(result.overtimeCost).toBe(58333); // Math.round(1.75 * 33333) = 58333
    });
  });

  describe("formatCurrency", () => {
    test("should format valid numbers correctly", () => {
      expect(formatCurrency(100000)).toBe("Rp\u00A0100.000");
      expect(formatCurrency(50000)).toBe("Rp\u00A050.000");
      expect(formatCurrency(0)).toBe("Rp\u00A00");
    });

    test("should handle invalid inputs", () => {
      expect(formatCurrency(null)).toBe("Rp 0");
      expect(formatCurrency(undefined)).toBe("Rp 0");
      expect(formatCurrency("not a number")).toBe("Rp 0");
      expect(formatCurrency(NaN)).toBe("Rp 0");
    });
  });

  describe("formatDateTime", () => {
    test("should format valid dates correctly", () => {
      const date = new Date("2025-11-07T14:30:00Z");
      const result = formatDateTime(date);
      expect(result).toContain("7 November 2025");
      expect(result).toContain("22.30");
    });

    test("should handle null/undefined inputs", () => {
      expect(formatDateTime(null)).toBe("-");
      expect(formatDateTime(undefined)).toBe("-");
      expect(formatDateTime("")).toBe("-");
    });
  });

  describe("Integration Tests - Real World Scenarios", () => {
    test("morning to evening rental (no overtime)", () => {
      // Rental from 8 AM to 8 PM (12 hours) - exactly package duration
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T20:00:00Z");

      const result = calculateOvertime(checkout, checkin, 12, 50000);

      expect(result.totalDurationHours).toBe(12);
      expect(result.overtimeHours).toBe(0);
      expect(result.overtimeCost).toBe(0);
    });

    test("morning to late evening rental (with overtime)", () => {
      // Rental from 8 AM to 11 PM (15 hours) - 3 hours overtime
      const checkout = new Date("2025-11-07T08:00:00Z");
      const checkin = new Date("2025-11-07T23:00:00Z");

      const result = calculateOvertime(checkout, checkin, 12, 75000);

      expect(result.totalDurationHours).toBe(15);
      expect(result.overtimeHours).toBe(3);
      expect(result.overtimeCost).toBe(225000); // 3 * 75000
    });

    test("afternoon to next morning (overnight rental)", () => {
      // Rental from 4 PM to 10 AM next day (18 hours) - 6 hours overtime
      const checkout = new Date("2025-11-07T16:00:00Z");
      const checkin = new Date("2025-11-08T10:00:00Z");

      const result = calculateOvertime(checkout, checkin, 12, 60000);

      expect(result.totalDurationHours).toBe(18);
      expect(result.overtimeHours).toBe(6);
      expect(result.overtimeCost).toBe(360000); // 6 * 60000
    });

    test("weekend rental with high overtime rate", () => {
      // Weekend rental with premium overtime rate
      const checkout = new Date("2025-11-09T09:00:00Z"); // Saturday
      const checkin = new Date("2025-11-09T21:00:00Z"); // 12 hours, but weekend rate

      const result = calculateOvertime(checkout, checkin, 12, 100000);

      expect(result.totalDurationHours).toBe(12);
      expect(result.overtimeHours).toBe(0);
      expect(result.overtimeCost).toBe(0);
    });
  });
});
