/**
 * Comprehensive Financial Audit Script
 * Audits financial calculations, PSAK compliance, and data integrity
 * for Pembukuan Kasir & List system
 */

const { PrismaClient } = require('@prisma/client');
const {
  calculateTransactionFinancials,
  calculateAggregateFinancials,
  calculateNetProfit,
  validateTransactionFinancials,
  formatCurrency
} = require('../src/lib/accounting');
const { calculateOvertime } = require('../src/lib/transaction-utils');

const prisma = new PrismaClient();

class FinancialAuditor {
  constructor() {
    this.findings = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      informational: []
    };
    this.auditStats = {
      transactionsAudited: 0,
      expensesAudited: 0,
      calculationsVerified: 0,
      errorsFound: 0,
      complianceIssues: 0
    };
  }

  logFinding(severity, category, description, details = {}) {
    const finding = {
      id: `${severity}_${this.findings[severity].length + 1}`,
      category,
      description,
      details,
      timestamp: new Date().toISOString()
    };

    this.findings[severity].push(finding);

    if (severity === 'critical' || severity === 'high') {
      this.auditStats.errorsFound++;
    }

    console.log(`[${severity.toUpperCase()}] ${category}: ${description}`);
  }

  /**
   * Audit 1: Verify arithmetic accuracy of financial calculations
   */
  async auditCalculationAccuracy() {
    console.log('\n🔍 AUDIT 1: Testing Financial Calculation Accuracy');

    // Test cases for transaction calculations
    const testCases = [
      {
        name: 'Basic 12-hour rental',
        transaction: {
          checkout_datetime: '2025-11-01T08:00:00Z',
          checkin_datetime: '2025-11-01T20:00:00Z',
          all_in_rate: 500000,
          overtime_rate_per_hour: 50000,
          package: { durationHours: 12 }
        },
        expected: {
          lamaSewaJam: 12,
          lamaOvertimeJam: 0,
          totalOvertimeFee: 0,
          totalPendapatan: 500000,
          labaKotor: 500000
        }
      },
      {
        name: 'Rental with 3 hours overtime',
        transaction: {
          checkout_datetime: '2025-11-01T08:00:00Z',
          checkin_datetime: '2025-11-01T23:00:00Z',
          all_in_rate: 500000,
          overtime_rate_per_hour: 50000,
          package: { durationHours: 12 }
        },
        expected: {
          lamaSewaJam: 15,
          lamaOvertimeJam: 3,
          totalOvertimeFee: 150000,
          totalPendapatan: 650000,
          labaKotor: 650000
        }
      },
      {
        name: 'Invalid date range (checkin before checkout)',
        transaction: {
          checkout_datetime: '2025-11-01T20:00:00Z',
          checkin_datetime: '2025-11-01T08:00:00Z',
          all_in_rate: 500000,
          overtime_rate_per_hour: 50000,
          package: { durationHours: 12 }
        },
        expected: {
          lamaSewaJam: 0,
          lamaOvertimeJam: 0,
          totalOvertimeFee: 0,
          totalPendapatan: 500000,
          labaKotor: 500000
        }
      }
    ];

    for (const testCase of testCases) {
      const result = calculateTransactionFinancials(testCase.transaction);

      // Check each expected value
      for (const [key, expectedValue] of Object.entries(testCase.expected)) {
        if (result[key] !== expectedValue) {
          this.logFinding('high', 'Calculation Error',
            `Incorrect ${key} calculation in ${testCase.name}`,
            {
              testCase: testCase.name,
              expected: expectedValue,
              actual: result[key],
              transaction: testCase.transaction
            });
        }
      }
    }

    // Test overtime calculation utility
    const overtimeTest = calculateOvertime(
      '2025-11-01T08:00:00Z',
      '2025-11-01T23:00:00Z',
      12,
      50000
    );

    if (overtimeTest.overtimeHours !== 3 || overtimeTest.overtimeCost !== 150000) {
      this.logFinding('high', 'Overtime Calculation Error',
        'Overtime calculation mismatch',
        {
          expected: { hours: 3, cost: 150000 },
          actual: { hours: overtimeTest.overtimeHours, cost: overtimeTest.overtimeCost }
        });
    }

    this.auditStats.calculationsVerified += testCases.length;
    console.log(`✅ Verified ${testCases.length} calculation test cases`);
  }

  /**
   * Audit 2: Check TOUR_PACKAGE pricing calculations
   */
  async auditTourPackagePricing() {
    console.log('\n🔍 AUDIT 2: Auditing TOUR_PACKAGE Pricing Logic');

    // Mock tour package with hotel tiers and price ranges
    const mockTourPackage = {
      type: 'TOUR_PACKAGE',
      hotelTiers: [
        {
          id: 'tier-1',
          starRating: 3,
          priceRanges: [
            { minPax: 1, maxPax: 2, price: 1500000 },
            { minPax: 3, maxPax: 5, price: 1400000 },
            { minPax: 6, maxPax: 10, price: 1300000 }
          ]
        }
      ]
    };

    const testCases = [
      {
        name: '2 pax in 3-star hotel',
        transaction: {
          package: mockTourPackage,
          hotel_tier_id: 'tier-1',
          pax_count: 2
        },
        expected: 3000000 // 2 * 1500000
      },
      {
        name: '5 pax in 3-star hotel',
        transaction: {
          package: mockTourPackage,
          hotel_tier_id: 'tier-1',
          pax_count: 5
        },
        expected: 7000000 // 5 * 1400000
      },
      {
        name: 'Invalid pax count (0)',
        transaction: {
          package: mockTourPackage,
          hotel_tier_id: 'tier-1',
          pax_count: 0
        },
        expected: 0
      }
    ];

    for (const testCase of testCases) {
      const result = calculateTransactionFinancials({
        ...testCase.transaction,
        checkout_datetime: '2025-11-01T08:00:00Z',
        checkin_datetime: '2025-11-01T20:00:00Z',
        all_in_rate: 1000000, // fallback
        overtime_rate_per_hour: 0
      });

      if (result.totalPendapatan !== testCase.expected) {
        this.logFinding('high', 'Tour Package Pricing Error',
          `Incorrect pricing for ${testCase.name}`,
          {
            testCase: testCase.name,
            expected: testCase.expected,
            actual: result.totalPendapatan
          });
      }
    }

    console.log(`✅ Verified ${testCases.length} tour package pricing scenarios`);
  }

  /**
   * Audit 3: Verify PSAK compliance
   */
  async auditPSAKCompliance() {
    console.log('\n🔍 AUDIT 3: Checking PSAK Compliance');

    // PSAK requires proper revenue recognition
    // Check if revenue is recognized at completion of service
    const transactions = await prisma.transaction.findMany({
      where: {
        approval_status: 'APPROVED'
      },
      include: {
        package: true
      },
      take: 100 // Sample audit
    });

    this.auditStats.transactionsAudited = transactions.length;

    for (const tx of transactions) {
      // PSAK 23: Revenue should be recognized when service is performed
      if (!tx.actual_checkin_datetime && tx.payment_status === 'PAID') {
        this.logFinding('medium', 'PSAK Compliance',
          'Revenue recognized before service completion',
          {
            transactionId: tx.id,
            invoiceCode: tx.invoice_code,
            paymentStatus: tx.payment_status,
            hasActualCheckin: !!tx.actual_checkin_datetime
          });
      }

      // Check for proper expense categorization
      if (tx.fuel_cost > 0 || tx.driver_fee > 0) {
        this.logFinding('informational', 'PSAK Compliance',
          'Transaction-level operational costs should be separate expenses',
          {
            transactionId: tx.id,
            fuelCost: tx.fuel_cost,
            driverFee: tx.driver_fee
          });
      }
    }

    // Check expense categorization consistency
    const expenses = await prisma.expense.findMany({
      where: { approval_status: 'APPROVED' },
      take: 100
    });

    this.auditStats.expensesAudited = expenses.length;

    const categoryCounts = {};
    expenses.forEach(expense => {
      categoryCounts[expense.category] = (categoryCounts[expense.category] || 0) + 1;
    });

    // PSAK requires consistent expense classification
    console.log(`📊 Expense categories found: ${Object.keys(categoryCounts).length}`);
    console.log(`📊 Total expenses audited: ${expenses.length}`);

    this.logFinding('informational', 'PSAK Compliance',
      'Expense categorization review completed',
      { categoryBreakdown: categoryCounts });
  }

  /**
   * Audit 4: Check for potential fraud indicators
   */
  async auditFraudIndicators() {
    console.log('\n🔍 AUDIT 4: Checking for Fraud Indicators');

    // Check for unusual patterns in transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        approval_status: 'APPROVED',
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      include: {
        package: true
      }
    });

    // Check for round number transactions (potential manipulation)
    const roundNumberTransactions = transactions.filter(tx => {
      const amount = tx.all_in_rate;
      return amount % 10000 === 0 && amount >= 100000; // Round to 10k, significant amount
    });

    if (roundNumberTransactions.length > transactions.length * 0.3) {
      this.logFinding('medium', 'Fraud Indicator',
        'High percentage of round number transactions',
        {
          roundNumberCount: roundNumberTransactions.length,
          totalTransactions: transactions.length,
          percentage: ((roundNumberTransactions.length / transactions.length) * 100).toFixed(1) + '%'
        });
    }

    // Check for transactions with same amount in short time periods
    const amountFrequency = {};
    transactions.forEach(tx => {
      const key = `${tx.all_in_rate}_${tx.createdAt.toDateString()}`;
      amountFrequency[key] = (amountFrequency[key] || 0) + 1;
    });

    const suspiciousFrequencies = Object.entries(amountFrequency)
      .filter(([key, count]) => count > 3)
      .map(([key, count]) => ({ amount: key.split('_')[0], date: key.split('_')[1], count }));

    if (suspiciousFrequencies.length > 0) {
      this.logFinding('low', 'Fraud Indicator',
        'Multiple transactions with same amount on same day',
        { suspiciousPatterns: suspiciousFrequencies });
    }

    // Check for expenses without proper approval workflow
    const unapprovedExpenses = await prisma.expense.count({
      where: { approval_status: { not: 'APPROVED' } }
    });

    if (unapprovedExpenses > 0) {
      this.logFinding('low', 'Fraud Prevention',
        'Expenses pending approval found',
        { pendingCount: unapprovedExpenses });
    }

    console.log(`✅ Fraud indicators checked for ${transactions.length} recent transactions`);
  }

  /**
   * Audit 5: Verify data integrity and consistency
   */
  async auditDataIntegrity() {
    console.log('\n🔍 AUDIT 5: Checking Data Integrity');

    // Check for transactions with invalid financial data
    const invalidTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { all_in_rate: { lt: 0 } },
          { overtime_rate_per_hour: { lt: 0 } },
          { dp_amount: { lt: 0 } }
        ]
      }
    });

    if (invalidTransactions.length > 0) {
      this.logFinding('critical', 'Data Integrity',
        'Transactions with negative financial amounts found',
        {
          count: invalidTransactions.length,
          transactions: invalidTransactions.map(tx => ({
            id: tx.id,
            invoiceCode: tx.invoice_code,
            allInRate: tx.all_in_rate,
            overtimeRate: tx.overtime_rate_per_hour,
            dpAmount: tx.dp_amount
          }))
        });
    }

    // Check for expenses with invalid amounts
    const invalidExpenses = await prisma.expense.findMany({
      where: { amount: { lt: 0 } }
    });

    if (invalidExpenses.length > 0) {
      this.logFinding('critical', 'Data Integrity',
        'Expenses with negative amounts found',
        {
          count: invalidExpenses.length,
          expenses: invalidExpenses.map(exp => ({
            id: exp.id,
            category: exp.category,
            amount: exp.amount,
            date: exp.date
          }))
        });
    }

    // Check for orphaned records (though schema indicates these are required fields)
    // Instead, check for transactions referencing non-existent armada/driver
    const transactions = await prisma.transaction.findMany({
      select: {
        id: true,
        invoice_code: true,
        armadaId: true,
        driverId: true
      },
      take: 100
    });

    // Verify armada references exist
    const armadaIds = [...new Set(transactions.map(tx => tx.armadaId))];
    const existingArmadas = await prisma.armada.findMany({
      where: { id: { in: armadaIds } },
      select: { id: true }
    });
    const existingArmadaIds = new Set(existingArmadas.map(a => a.id));

    const orphanedArmadaTransactions = transactions.filter(tx => !existingArmadaIds.has(tx.armadaId));

    if (orphanedArmadaTransactions.length > 0) {
      this.logFinding('high', 'Data Integrity',
        'Transactions referencing non-existent armada',
        {
          count: orphanedArmadaTransactions.length,
          transactions: orphanedArmadaTransactions.map(tx => ({
            id: tx.id,
            invoiceCode: tx.invoice_code,
            armadaId: tx.armadaId
          }))
        });
    }

    // Verify driver references exist
    const driverIds = [...new Set(transactions.map(tx => tx.driverId))];
    const existingDrivers = await prisma.driver.findMany({
      where: { id: { in: driverIds } },
      select: { id: true }
    });
    const existingDriverIds = new Set(existingDrivers.map(d => d.id));

    const orphanedDriverTransactions = transactions.filter(tx => !existingDriverIds.has(tx.driverId));

    if (orphanedDriverTransactions.length > 0) {
      this.logFinding('high', 'Data Integrity',
        'Transactions referencing non-existent driver',
        {
          count: orphanedDriverTransactions.length,
          transactions: orphanedDriverTransactions.map(tx => ({
            id: tx.id,
            invoiceCode: tx.invoice_code,
            driverId: tx.driverId
          }))
        });
    }

    console.log(`✅ Data integrity checks completed`);
  }

  /**
   * Audit 6: Verify audit trail completeness
   */
  async auditTrailCompleteness() {
    console.log('\n🔍 AUDIT 6: Checking Audit Trail Completeness');

    const totalTransactions = await prisma.transaction.count();
    const totalExpenses = await prisma.expense.count();
    const totalAuditLogs = await prisma.auditLog.count();

    // Check if audit logs exist for financial operations
    const financialAuditLogs = await prisma.auditLog.count({
      where: {
        resource: {
          in: ['Transaction', 'Expense']
        },
        action: {
          in: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT']
        }
      }
    });

    const auditCoverage = ((financialAuditLogs / (totalTransactions + totalExpenses)) * 100);

    if (auditCoverage < 80) {
      this.logFinding('medium', 'Audit Trail',
        'Insufficient audit log coverage for financial operations',
        {
          totalTransactions: totalTransactions,
          totalExpenses: totalExpenses,
          financialAuditLogs: financialAuditLogs,
          coveragePercentage: auditCoverage.toFixed(1) + '%'
        });
    }

    // Check for recent audit log gaps
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (recentLogs.length === 0) {
      this.logFinding('high', 'Audit Trail',
        'No audit logs found for recent period',
        { daysChecked: 7 });
    }

    console.log(`✅ Audit trail coverage: ${auditCoverage.toFixed(1)}%`);
  }

  /**
   * Generate comprehensive audit report
   */
  generateReport() {
    const report = {
      auditMetadata: {
        auditDate: new Date().toISOString(),
        auditor: 'Financial Audit Script',
        systemVersion: 'Pembukuan Kasir & List',
        auditPeriod: 'All historical data',
        standards: ['PSAK (Indonesian Accounting Standards)']
      },
      auditStatistics: this.auditStats,
      findings: this.findings,
      summary: {
        totalFindings: Object.values(this.findings).reduce((sum, arr) => sum + arr.length, 0),
        criticalIssues: this.findings.critical.length,
        highIssues: this.findings.high.length,
        mediumIssues: this.findings.medium.length,
        lowIssues: this.findings.low.length,
        informationalItems: this.findings.informational.length
      },
      recommendations: this.generateRecommendations(),
      complianceStatus: this.assessCompliance()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.findings.critical.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Data Integrity',
        action: 'Immediately correct all negative financial amounts and orphaned records',
        timeline: 'Immediate',
        responsible: 'System Administrator'
      });
    }

    if (this.findings.high.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Calculation Accuracy',
        action: 'Review and fix financial calculation formulas',
        timeline: 'Within 1 week',
        responsible: 'Development Team'
      });
    }

    recommendations.push({
      priority: 'MEDIUM',
      category: 'PSAK Compliance',
      action: 'Implement proper revenue recognition timing',
      timeline: 'Within 1 month',
      responsible: 'Finance Team'
    });

    recommendations.push({
      priority: 'LOW',
      category: 'Fraud Prevention',
      action: 'Enhance monitoring for suspicious transaction patterns',
      timeline: 'Within 3 months',
      responsible: 'Security Team'
    });

    return recommendations;
  }

  assessCompliance() {
    const totalIssues = this.findings.critical.length + this.findings.high.length + this.findings.medium.length;

    if (totalIssues === 0) {
      return {
        status: 'FULLY_COMPLIANT',
        description: 'No compliance issues found',
        score: 100
      };
    } else if (this.findings.critical.length > 0) {
      return {
        status: 'NON_COMPLIANT',
        description: 'Critical compliance violations require immediate attention',
        score: 0
      };
    } else if (this.findings.high.length > 0) {
      return {
        status: 'PARTIALLY_COMPLIANT',
        description: 'High-priority issues need resolution',
        score: 60
      };
    } else {
      return {
        status: 'MOSTLY_COMPLIANT',
        description: 'Minor issues found, generally compliant',
        score: 85
      };
    }
  }

  /**
   * Run complete audit
   */
  async runCompleteAudit() {
    console.log('🚀 Starting Comprehensive Financial Audit');
    console.log('=' .repeat(50));

    try {
      await this.auditCalculationAccuracy();
      await this.auditTourPackagePricing();
      await this.auditPSAKCompliance();
      await this.auditFraudIndicators();
      await this.auditDataIntegrity();
      await this.auditTrailCompleteness();

      const report = this.generateReport();

      console.log('\n' + '=' .repeat(50));
      console.log('📊 AUDIT RESULTS SUMMARY');
      console.log('=' .repeat(50));
      console.log(`Total Findings: ${report.summary.totalFindings}`);
      console.log(`Critical Issues: ${report.summary.criticalIssues}`);
      console.log(`High Priority: ${report.summary.highIssues}`);
      console.log(`Medium Priority: ${report.summary.mediumIssues}`);
      console.log(`Low Priority: ${report.summary.lowIssues}`);
      console.log(`Informational: ${report.summary.informationalItems}`);
      console.log(`Compliance Status: ${report.complianceStatus.status}`);
      console.log(`Compliance Score: ${report.complianceStatus.score}/100`);

      return report;

    } catch (error) {
      console.error('❌ Audit failed:', error);
      this.logFinding('critical', 'Audit Process',
        'Audit execution failed',
        { error: error.message });
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Export for use in other scripts
module.exports = { FinancialAuditor };

// Run audit if called directly
if (require.main === module) {
  const auditor = new FinancialAuditor();
  auditor.runCompleteAudit()
    .then((report) => {
      console.log('\n✅ Audit completed successfully');
      console.log('📄 Full report available in audit results');

      // Save report to file
      const fs = require('fs');
      const reportPath = `./audit-report-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`💾 Report saved to: ${reportPath}`);
    })
    .catch((error) => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}