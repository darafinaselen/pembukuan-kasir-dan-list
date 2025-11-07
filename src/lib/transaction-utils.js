/**
 * Utility functions for transaction overtime calculations
 */

/**
 * Calculate overtime hours and cost based on actual check-in time
 * @param {Date|string} checkoutTime - When the vehicle left
 * @param {Date|string} actualCheckinTime - When the vehicle actually returned
 * @param {number} packageDurationHours - Package duration in hours (default: 12)
 * @param {number} overtimeRatePerHour - Rate per overtime hour
 * @returns {object} - { overtimeHours, overtimeCost, totalDurationHours }
 */
export function calculateOvertime(
  checkoutTime,
  actualCheckinTime,
  packageDurationHours = 12,
  overtimeRatePerHour = 0
) {
  if (!checkoutTime || !actualCheckinTime) {
    return {
      overtimeHours: 0,
      overtimeCost: 0,
      totalDurationHours: 0,
    };
  }

  const checkout = new Date(checkoutTime);
  const checkin = new Date(actualCheckinTime);

  // If checkin is before or equal to checkout, no overtime
  if (checkin <= checkout) {
    return {
      overtimeHours: 0,
      overtimeCost: 0,
      totalDurationHours: 0,
    };
  }

  // Calculate total duration in hours
  const diffMs = checkin.getTime() - checkout.getTime();
  const totalDurationHours = diffMs / (1000 * 60 * 60);

  // Calculate overtime (max 0 to handle negative values)
  const overtimeHours = Math.max(0, totalDurationHours - packageDurationHours);

  // Calculate cost
  const overtimeCost = Math.round(overtimeHours * overtimeRatePerHour);

  return {
    overtimeHours,
    overtimeCost,
    totalDurationHours,
  };
}

/**
 * Format currency in Indonesian Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date and time for display
 * @param {Date|string} dateTime - Date to format
 * @returns {string} - Formatted date time string
 */
export function formatDateTime(dateTime) {
  if (!dateTime) return "-";
  return new Date(dateTime).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
