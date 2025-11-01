/**
 * Accounting Utilities
 * Centralized financial calculation logic for consistency across the application
 */

/**
 * Calculate financial details for a single transaction
 * @param {Object} transaction - Transaction object with all financial fields
 * @returns {Object} Calculated financial metrics
 */
export function calculateTransactionFinancials(transaction) {
  // Default duration is 12 hours if no package specified
  const durasiPaketJam = transaction.package?.durationHours || 12;

  const start = new Date(transaction.checkout_datetime);
  const end = new Date(transaction.checkin_datetime);

  // Edge case: Invalid time range
  if (end <= start) {
    return {
      lamaSewaJam: 0,
      lamaOvertimeJam: 0,
      totalOvertimeFee: 0,
      totalPendapatan: transaction.all_in_rate || 0,
      totalBiayaOps:
        (transaction.fuel_cost || 0) + (transaction.driver_fee || 0),
      labaKotor:
        (transaction.all_in_rate || 0) -
        ((transaction.fuel_cost || 0) + (transaction.driver_fee || 0)),
    };
  }

  // Calculate rental duration in hours
  const diffMs = end.getTime() - start.getTime();
  const lamaSewaJam = Math.round(diffMs / (1000 * 60 * 60));

  // Calculate overtime hours (cannot be negative)
  const lamaOvertimeJam = Math.max(0, lamaSewaJam - durasiPaketJam);

  // Calculate overtime fee
  const totalOvertimeFee =
    lamaOvertimeJam * (transaction.overtime_rate_per_hour || 0);

  // Calculate total revenue (base rate + overtime)
  const totalPendapatan = (transaction.all_in_rate || 0) + totalOvertimeFee;

  // Calculate total operational costs
  const totalBiayaOps =
    (transaction.fuel_cost || 0) + (transaction.driver_fee || 0);

  // Calculate gross profit
  const labaKotor = totalPendapatan - totalBiayaOps;

  return {
    lamaSewaJam,
    lamaOvertimeJam,
    totalOvertimeFee,
    totalPendapatan,
    totalBiayaOps,
    labaKotor,
  };
}

/**
 * Calculate aggregate financial metrics for multiple transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Aggregated financial metrics
 */
export function calculateAggregateFinancials(transactions) {
  let totalRevenue = 0;
  let totalOperationalCosts = 0;
  let totalGrossProfit = 0;
  let totalOvertimeFees = 0;

  transactions.forEach((transaction) => {
    const financials = calculateTransactionFinancials(transaction);
    totalRevenue += financials.totalPendapatan;
    totalOperationalCosts += financials.totalBiayaOps;
    totalGrossProfit += financials.labaKotor;
    totalOvertimeFees += financials.totalOvertimeFee;
  });

  return {
    totalRevenue,
    totalOperationalCosts,
    totalGrossProfit,
    totalOvertimeFees,
    transactionCount: transactions.length,
    averageRevenue:
      transactions.length > 0 ? totalRevenue / transactions.length : 0,
    averageProfit:
      transactions.length > 0 ? totalGrossProfit / transactions.length : 0,
  };
}

/**
 * Calculate net profit including office expenses
 * @param {number} grossProfit - Total gross profit from transactions
 * @param {number} officeExpenses - Total office/operational expenses
 * @returns {Object} Net profit calculation
 */
export function calculateNetProfit(grossProfit, officeExpenses) {
  const netProfit = grossProfit - officeExpenses;
  const profitMargin = grossProfit > 0 ? (netProfit / grossProfit) * 100 : 0;

  return {
    grossProfit,
    officeExpenses,
    netProfit,
    profitMargin,
  };
}

/**
 * Validate transaction financial data
 * @param {Object} transaction - Transaction object to validate
 * @returns {Object} Validation result with errors array
 */
export function validateTransactionFinancials(transaction) {
  const errors = [];

  // Validate checkout before checkin
  const checkout = new Date(transaction.checkout_datetime);
  const checkin = new Date(transaction.checkin_datetime);

  if (checkin <= checkout) {
    errors.push("Check-in time must be after check-out time");
  }

  // Validate positive amounts
  if (transaction.all_in_rate < 0) {
    errors.push("All-in rate cannot be negative");
  }

  if (transaction.overtime_rate_per_hour < 0) {
    errors.push("Overtime rate cannot be negative");
  }

  if (transaction.fuel_cost < 0) {
    errors.push("Fuel cost cannot be negative");
  }

  if (transaction.driver_fee < 0) {
    errors.push("Driver fee cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format currency to IDR
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency to compact notation (for charts/dashboards)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrencyCompact(amount) {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(amount);
}
