/**
 * Accounting Utilities
 * Centralized financial calculation logic for consistency across the application
 */

/**
 * Calculate TOUR_PACKAGE pricing based on hotel tier and pax count
 * @param {Object} transaction - Transaction object with package and hotel_tier_id
 * @returns {number} Calculated price for the TOUR_PACKAGE
 */
function calculateTourPackagePrice(transaction) {
  if (!transaction.package || transaction.package.type !== "TOUR_PACKAGE") {
    return transaction.all_in_rate || 0;
  }

  if (!transaction.hotel_tier_id || !transaction.pax_count) {
    return 0;
  }

  // Find the selected hotel tier
  const selectedTier = transaction.package.hotelTiers?.find(
    (tier) => tier.id === transaction.hotel_tier_id
  );

  if (!selectedTier || !selectedTier.priceRanges) {
    return 0;
  }

  const paxCount = parseInt(transaction.pax_count) || 0;
  if (paxCount <= 0) {
    return 0;
  }

  // Find the appropriate price range for the pax count
  const applicableRange = selectedTier.priceRanges.find(
    (range) => paxCount >= range.minPax && paxCount <= range.maxPax
  );

  if (!applicableRange) {
    return 0;
  }

  // Calculate total price: price per pax * number of pax
  return applicableRange.pricePerPax * paxCount;
}

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

  // Validate dates are valid Date objects
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      lamaSewaJam: 0,
      lamaOvertimeJam: 0,
      totalOvertimeFee: 0,
      totalPendapatan: transaction.all_in_rate || 0,
      totalBiayaOps: 0,
      labaKotor: transaction.all_in_rate || 0,
      error: "Invalid date format",
    };
  }

  // Edge case: Invalid time range
  if (end <= start) {
    return {
      lamaSewaJam: 0,
      lamaOvertimeJam: 0,
      totalOvertimeFee: 0,
      totalPendapatan: transaction.all_in_rate || 0,
      totalBiayaOps: 0,
      labaKotor: transaction.all_in_rate || 0,
    };
  }

  // Calculate rental duration in hours
  const diffMs = end.getTime() - start.getTime();
  const lamaSewaJam = Math.round(diffMs / (1000 * 60 * 60));

  // For TOUR_PACKAGE, no overtime calculation
  const isTourPackage = transaction.package?.type === "TOUR_PACKAGE";
  const lamaOvertimeJam = isTourPackage
    ? 0
    : Math.max(0, lamaSewaJam - durasiPaketJam);

  // Calculate overtime fee (0 for TOUR_PACKAGE)
  const totalOvertimeFee = isTourPackage
    ? 0
    : lamaOvertimeJam * (transaction.overtime_rate_per_hour || 0);

  // Calculate base revenue (use TOUR_PACKAGE pricing if applicable)
  const baseRevenue = isTourPackage
    ? calculateTourPackagePrice(transaction)
    : transaction.all_in_rate || 0;

  // Calculate total revenue (base rate + overtime)
  const totalPendapatan = baseRevenue + totalOvertimeFee;

  // Operational costs from transaction-level fuel/driver are removed
  const totalBiayaOps = 0;

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
