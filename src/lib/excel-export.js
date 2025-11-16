import * as XLSX from "xlsx";

/**
 * Enhanced Excel Export Utility
 * Provides professional Excel exports with multiple sheets, styling, and comprehensive data presentation
 */

// Style definitions for professional appearance
const STYLES = {
  header: {
    font: { bold: true, sz: 14 },
    fill: { fgColor: { rgb: "FFE6E6FA" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FF000000" } },
      bottom: { style: "thin", color: { rgb: "FF000000" } },
      left: { style: "thin", color: { rgb: "FF000000" } },
      right: { style: "thin", color: { rgb: "FF000000" } }
    }
  },
  subHeader: {
    font: { bold: true, sz: 12 },
    fill: { fgColor: { rgb: "FFF0F8FF" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FF000000" } },
      bottom: { style: "thin", color: { rgb: "FF000000" } },
      left: { style: "thin", color: { rgb: "FF000000" } },
      right: { style: "thin", color: { rgb: "FF000000" } }
    }
  },
  data: {
    font: { sz: 10 },
    alignment: { horizontal: "left", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } }
    }
  },
  currency: {
    font: { sz: 10 },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } }
    },
    numFmt: '"Rp" #,##0'
  },
  number: {
    font: { sz: 10 },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } }
    }
  },
  total: {
    font: { bold: true, sz: 11 },
    fill: { fgColor: { rgb: "FFFFE4B5" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "thick", color: { rgb: "FF000000" } },
      bottom: { style: "thick", color: { rgb: "FF000000" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } }
    },
    numFmt: '"Rp" #,##0'
  },
  positive: {
    font: { sz: 10, color: { rgb: "FF008000" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } }
    },
    numFmt: '"Rp" #,##0'
  },
  negative: {
    font: { sz: 10, color: { rgb: "FFFF0000" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
      left: { style: "thin", color: { rgb: "FFCCCCCC" } },
      right: { style: "thin", color: { rgb: "FFCCCCCC" } }
    },
    numFmt: '"Rp" #,##0'
  }
};

/**
 * Create a new Excel workbook with professional styling
 */
export function createWorkbook() {
  const wb = XLSX.utils.book_new();

  // Set workbook properties
  wb.Props = {
    Title: "Laporan Bisnis",
    Subject: "Laporan Keuangan",
    Author: "Sistem Pembukuan Kasir",
    CreatedDate: new Date()
  };

  return wb;
}

/**
 * Add a sheet to workbook with data and styling
 */
export function addSheet(wb, sheetName, data, options = {}) {
  const {
    startRow = 0,
    startCol = 0,
    styleMap = {},
    columnWidths = [],
    mergeCells = []
  } = options;

  // Convert data to worksheet
  const ws = XLSX.utils.aoa_to_sheet(data, { origin: { r: startRow, c: startCol } });

  // Apply styles
  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (ws[cellRef]) {
          const styleKey = styleMap[`${r},${c}`] || styleMap[r] || 'data';
          if (STYLES[styleKey]) {
            ws[cellRef].s = STYLES[styleKey];
          }
        }
      }
    }
  }

  // Set column widths
  if (columnWidths.length > 0) {
    ws['!cols'] = columnWidths.map(width => ({ wch: width }));
  }

  // Merge cells
  if (mergeCells.length > 0) {
    ws['!merges'] = mergeCells;
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

/**
 * Generate report header with company info and date range
 */
export function generateReportHeader(title, dateRange, companyInfo = {}) {
  const { companyName = "PT. Pembukuan Kasir", generatedBy = "Sistem" } = companyInfo;

  const header = [
    [companyName],
    [`Laporan: ${title}`],
    [`Periode: ${dateRange.from} s/d ${dateRange.to}`],
    [`Dibuat pada: ${new Date().toLocaleString('id-ID')}`],
    [`Oleh: ${generatedBy}`],
    [], // Empty row
  ];

  return header;
}

/**
 * Format currency for Excel (without currency symbol for numFmt)
 */
export function formatCurrencyForExcel(amount) {
  return parseFloat(amount) || 0;
}

/**
 * Create summary sheet with key metrics
 */
export function createSummarySheet(metrics, title = "Ringkasan") {
  const data = [
    [title],
    [],
    ["Metrik", "Nilai"],
    ...metrics.map(([label, value]) => [label, value])
  ];

  const styleMap = {
    '0,0': 'header',
    '2,0': 'subHeader',
    '2,1': 'subHeader'
  };

  // Apply currency styling to value column
  metrics.forEach((_, index) => {
    const rowIndex = index + 3;
    styleMap[`${rowIndex},1`] = typeof metrics[index][1] === 'number' ? 'currency' : 'data';
  });

  return { data, styleMap };
}

/**
 * Export workbook to file
 */
export function exportWorkbook(wb, fileName) {
  try {
    const finalFileName = `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, finalFileName);
    return finalFileName;
  } catch (error) {
    console.error("Failed to export Excel:", error);
    throw new Error("Gagal mengunduh laporan Excel.");
  }
}

/**
 * Specialized export functions for different report types
 */

/**
 * Export transaction summary report
 */
export function exportTransactionReport(data, dateRange) {
  const wb = createWorkbook();

  // Summary sheet
  const summaryMetrics = [
    ["Total Transaksi", data.totalTransaksi || 0],
    ["Total Pemasukan Sewa", formatCurrencyForExcel(data.totalPemasukan || 0)],
    ["Total Pengeluaran (BBM + Gaji)", formatCurrencyForExcel(data.totalPengeluaranOps || 0)],
    ["Total Laba Kotor", formatCurrencyForExcel(data.totalLabaKotor || 0)]
  ];

  const summarySheet = createSummarySheet(summaryMetrics, "Ringkasan Transaksi");
  addSheet(wb, "Ringkasan", summarySheet.data, {
    styleMap: summarySheet.styleMap,
    columnWidths: [30, 20]
  });

  // Profit/Loss Analysis sheet
  const profitLossData = [
    ["Analisis Laba Rugi"],
    [],
    ["Kategori", "Jumlah", "Persentase"],
    ["Pemasukan Sewa", formatCurrencyForExcel(data.totalPemasukan || 0), "100%"],
    ["Pengeluaran Operasional", formatCurrencyForExcel(data.totalPengeluaranOps || 0),
     data.totalPemasukan ? `${((data.totalPengeluaranOps / data.totalPemasukan) * 100).toFixed(1)}%` : "0%"],
    ["Laba Kotor", formatCurrencyForExcel(data.totalLabaKotor || 0),
     data.totalPemasukan ? `${((data.totalLabaKotor / data.totalPemasukan) * 100).toFixed(1)}%` : "0%"]
  ];

  const profitLossStyleMap = {
    '0,0': 'header',
    '2,0': 'subHeader',
    '2,1': 'subHeader',
    '2,2': 'subHeader',
    '3,1': 'currency',
    '4,1': 'currency',
    '5,1': data.totalLabaKotor >= 0 ? 'positive' : 'negative'
  };

  addSheet(wb, "Analisis Laba Rugi", profitLossData, {
    styleMap: profitLossStyleMap,
    columnWidths: [25, 20, 15]
  });

  return exportWorkbook(wb, "Laporan_Transaksi");
}

/**
 * Export income report with package breakdown
 */
export function exportIncomeReport(data, dateRange, filters = {}) {
  const wb = createWorkbook();

  // Summary sheet
  const summaryMetrics = [
    ["Total Paket", data.summary?.totalPackages || 0],
    ["Total Transaksi", data.summary?.totalTransactions || 0],
    ["Total Pemasukan", formatCurrencyForExcel(data.summary?.totalRevenue || 0)],
    ["Rata-rata per Paket", formatCurrencyForExcel(data.summary?.averageRevenuePerPackage || 0)]
  ];

  const summarySheet = createSummarySheet(summaryMetrics, "Ringkasan Pemasukan");
  addSheet(wb, "Ringkasan", summarySheet.data, {
    styleMap: summarySheet.styleMap,
    columnWidths: [30, 20]
  });

  // Package Performance sheet
  const packageHeaders = ["Nama Paket", "Jenis", "Transaksi", "Total Pemasukan", "Rata-rata", "% dari Total"];
  const packageData = [
    ["Analisis Performa Paket"],
    [],
    packageHeaders,
    ...data.incomeByPackage.map(pkg => [
      pkg.packageName,
      pkg.packageType,
      pkg.transactionCount,
      formatCurrencyForExcel(pkg.totalRevenue),
      formatCurrencyForExcel(pkg.averageRevenue),
      data.summary?.totalRevenue ?
        `${((pkg.totalRevenue / data.summary.totalRevenue) * 100).toFixed(1)}%` : "0%"
    ])
  ];

  const packageStyleMap = {
    '0,0': 'header',
    '2,0': 'subHeader',
    '2,1': 'subHeader',
    '2,2': 'subHeader',
    '2,3': 'subHeader',
    '2,4': 'subHeader',
    '2,5': 'subHeader'
  };

  // Apply styling to data rows
  data.incomeByPackage.forEach((_, index) => {
    const rowIndex = index + 3;
    packageStyleMap[`${rowIndex},0`] = 'data';
    packageStyleMap[`${rowIndex},1`] = 'data';
    packageStyleMap[`${rowIndex},2`] = 'number';
    packageStyleMap[`${rowIndex},3`] = 'currency';
    packageStyleMap[`${rowIndex},4`] = 'currency';
    packageStyleMap[`${rowIndex},5`] = 'data';
  });

  addSheet(wb, "Performa Paket", packageData, {
    styleMap: packageStyleMap,
    columnWidths: [25, 20, 12, 18, 15, 12]
  });

  // Transaction Details sheet
  const transactionHeaders = ["Invoice", "Pelanggan", "Tanggal", "Paket", "Tarif Dasar", "Overtime", "Total"];
  const transactionData = [
    ["Detail Transaksi"],
    [],
    transactionHeaders
  ];

  data.incomeByPackage.forEach(pkg => {
    pkg.transactions.forEach(tx => {
      transactionData.push([
        tx.invoice_code,
        tx.customer_name,
        new Date(tx.booking_date).toLocaleDateString('id-ID'),
        pkg.packageName,
        formatCurrencyForExcel(tx.baseRevenue),
        formatCurrencyForExcel(tx.overtimeRevenue),
        formatCurrencyForExcel(tx.totalRevenue)
      ]);
    });
  });

  const transactionStyleMap = {
    '0,0': 'header',
    '2,0': 'subHeader',
    '2,1': 'subHeader',
    '2,2': 'subHeader',
    '2,3': 'subHeader',
    '2,4': 'subHeader',
    '2,5': 'subHeader',
    '2,6': 'subHeader'
  };

  // Apply styling to transaction data rows
  let rowIndex = 3;
  data.incomeByPackage.forEach(pkg => {
    pkg.transactions.forEach(() => {
      transactionStyleMap[`${rowIndex},4`] = 'currency';
      transactionStyleMap[`${rowIndex},5`] = 'currency';
      transactionStyleMap[`${rowIndex},6`] = 'currency';
      rowIndex++;
    });
  });

  addSheet(wb, "Detail Transaksi", transactionData, {
    styleMap: transactionStyleMap,
    columnWidths: [15, 20, 12, 25, 15, 12, 15]
  });

  const filterSuffix = filters.packageType ? `_${filters.packageType}` : '';
  return exportWorkbook(wb, `Laporan_Pemasukan${filterSuffix}`);
}

/**
 * Export expense report with category breakdown
 */
export function exportExpenseReport(data, dateRange) {
  const wb = createWorkbook();

  // Summary sheet
  const summaryMetrics = [
    ["Total Pengeluaran", formatCurrencyForExcel(data.summary?.totalAmount || 0)],
    ["Jumlah Transaksi", data.summary?.totalExpenses || 0],
    ["Jumlah Kategori", data.summary?.categoriesCount || 0],
    ["Rata-rata per Transaksi", formatCurrencyForExcel(data.summary ? Math.round(data.summary.totalAmount / data.summary.totalExpenses) : 0)]
  ];

  const summarySheet = createSummarySheet(summaryMetrics, "Ringkasan Pengeluaran");
  addSheet(wb, "Ringkasan", summarySheet.data, {
    styleMap: summarySheet.styleMap,
    columnWidths: [30, 20]
  });

  // Category Breakdown sheet
  const categoryHeaders = ["Kategori", "Total Amount", "Jumlah Transaksi", "Persentase"];
  const categoryData = [
    ["Breakdown per Kategori"],
    [],
    categoryHeaders,
    ...data.data.map(cat => [
      cat.category,
      formatCurrencyForExcel(cat.totalAmount),
      cat.count,
      data.summary?.totalAmount ? `${((cat.totalAmount / data.summary.totalAmount) * 100).toFixed(1)}%` : "0%"
    ])
  ];

  const categoryStyleMap = {
    '0,0': 'header',
    '2,0': 'subHeader',
    '2,1': 'subHeader',
    '2,2': 'subHeader',
    '2,3': 'subHeader'
  };

  // Apply styling to category data rows
  data.data.forEach((_, index) => {
    const rowIndex = index + 3;
    categoryStyleMap[`${rowIndex},0`] = 'data';
    categoryStyleMap[`${rowIndex},1`] = 'currency';
    categoryStyleMap[`${rowIndex},2`] = 'number';
    categoryStyleMap[`${rowIndex},3`] = 'data';
  });

  addSheet(wb, "Kategori", categoryData, {
    styleMap: categoryStyleMap,
    columnWidths: [25, 18, 15, 12]
  });

  // Transaction Details sheet
  const transactionHeaders = ["Tanggal", "Kategori", "Deskripsi", "Jumlah", "Penerima", "Armada", "Sopir", "Staff"];
  const transactionData = [
    ["Detail Transaksi"],
    [],
    transactionHeaders
  ];

  // Get all expenses (prefer rawExpenses if available)
  const allExpenses = data.rawExpenses || data.data.flatMap(cat => cat.expenses);

  allExpenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(expense => {
      transactionData.push([
        new Date(expense.date).toLocaleDateString('id-ID'),
        expense.category,
        expense.description,
        formatCurrencyForExcel(expense.amount),
        expense.namaPenerima || "-",
        expense.armada?.license_plate || "-",
        expense.driver?.driver_name || "-",
        expense.staff?.name || "-"
      ]);
    });

  const transactionStyleMap = {
    '0,0': 'header',
    '2,0': 'subHeader',
    '2,1': 'subHeader',
    '2,2': 'subHeader',
    '2,3': 'subHeader',
    '2,4': 'subHeader',
    '2,5': 'subHeader',
    '2,6': 'subHeader',
    '2,7': 'subHeader'
  };

  // Apply styling to transaction data rows
  let rowIndex = 3;
  allExpenses.forEach(() => {
    transactionStyleMap[`${rowIndex},3`] = 'currency';
    rowIndex++;
  });

  addSheet(wb, "Detail Transaksi", transactionData, {
    styleMap: transactionStyleMap,
    columnWidths: [12, 20, 40, 15, 20, 15, 20, 20]
  });

  return exportWorkbook(wb, `Laporan_Pengeluaran`);
}

/**
 * Export rekap report with category-wise monthly breakdown
 */
export function exportRekapReport(data, dateRange) {
  const wb = createWorkbook();

  // Summary sheet
  const summaryMetrics = [
    ["Total Pengeluaran", formatCurrencyForExcel(data.summary?.totalExpenses || 0)],
    ["Jumlah Transaksi", data.summary?.totalTransactions || 0],
    ["Jumlah Kategori", data.summary?.categories || 0]
  ];

  const summarySheet = createSummarySheet(summaryMetrics, "Ringkasan Rekap");
  addSheet(wb, "Ringkasan", summarySheet.data, {
    styleMap: summarySheet.styleMap,
    columnWidths: [30, 20]
  });

  // Category-wise Monthly Breakdown sheet
  const monthlyHeaders = ["Kategori", "Total Pengeluaran", "Jumlah Transaksi"];
  const monthlyData = [
    ["Rekap Bulanan per Kategori"],
    [],
    monthlyHeaders
  ];

  // Add month headers dynamically
  const allMonths = new Set();
  data.rekap.forEach(cat => {
    cat.months.forEach(month => allMonths.add(month.month));
  });
  const sortedMonths = Array.from(allMonths).sort();

  // Add month columns to headers
  sortedMonths.forEach(month => {
    monthlyHeaders.push(new Date(month + "-01").toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }));
  });

  // Add data rows
  data.rekap.forEach(cat => {
    const row = [
      cat.category,
      formatCurrencyForExcel(cat.totalAmount),
      cat.totalCount
    ];

    // Add monthly data
    sortedMonths.forEach(month => {
      const monthData = cat.months.find(m => m.month === month);
      row.push(monthData ? formatCurrencyForExcel(monthData.total) : 0);
    });

    monthlyData.push(row);
  });

  const monthlyStyleMap = {
    '0,0': 'header',
    '2,0': 'subHeader',
    '2,1': 'subHeader',
    '2,2': 'subHeader'
  };

  // Apply styling to month headers
  sortedMonths.forEach((_, index) => {
    monthlyStyleMap[`2,${index + 3}`] = 'subHeader';
  });

  // Apply styling to data rows
  data.rekap.forEach((_, catIndex) => {
    const rowIndex = catIndex + 3;
    monthlyStyleMap[`${rowIndex},1`] = 'currency';
    sortedMonths.forEach((_, monthIndex) => {
      monthlyStyleMap[`${rowIndex},${monthIndex + 3}`] = 'currency';
    });
  });

  addSheet(wb, "Rekap Bulanan", monthlyData, {
    styleMap: monthlyStyleMap,
    columnWidths: [25, 18, 15, ...sortedMonths.map(() => 15)]
  });

  // Trend Analysis sheet
  const trendHeaders = ["Bulan", "Total Pengeluaran", "Jumlah Transaksi", "Rata-rata per Transaksi", "Pertumbuhan (%)"];
  const trendData = [
    ["Analisis Tren"],
    [],
    trendHeaders
  ];

  let previousTotal = 0;
  sortedMonths.forEach((month, index) => {
    const monthTotal = data.rekap.reduce((sum, cat) => {
      const monthData = cat.months.find(m => m.month === month);
      return sum + (monthData ? monthData.total : 0);
    }, 0);

    const monthCount = data.rekap.reduce((sum, cat) => {
      const monthData = cat.months.find(m => m.month === month);
      return sum + (monthData ? monthData.count : 0);
    }, 0);

    const average = monthCount > 0 ? monthTotal / monthCount : 0;
    const growth = index > 0 && previousTotal > 0 ? ((monthTotal - previousTotal) / previousTotal) * 100 : 0;

    trendData.push([
      new Date(month + "-01").toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }),
      formatCurrencyForExcel(monthTotal),
      monthCount,
      formatCurrencyForExcel(Math.round(average)),
      growth !== 0 ? `${growth.toFixed(1)}%` : "-"
    ]);

    previousTotal = monthTotal;
  });

  const trendStyleMap = {
    '0,0': 'header',
    '2,0': 'subHeader',
    '2,1': 'subHeader',
    '2,2': 'subHeader',
    '2,3': 'subHeader',
    '2,4': 'subHeader'
  };

  // Apply styling to trend data
  sortedMonths.forEach((_, index) => {
    const rowIndex = index + 3;
    trendStyleMap[`${rowIndex},1`] = 'currency';
    trendStyleMap[`${rowIndex},3`] = 'currency';
  });

  addSheet(wb, "Analisis Tren", trendData, {
    styleMap: trendStyleMap,
    columnWidths: [15, 18, 15, 20, 15]
  });

  return exportWorkbook(wb, `Laporan_Rekap`);
}