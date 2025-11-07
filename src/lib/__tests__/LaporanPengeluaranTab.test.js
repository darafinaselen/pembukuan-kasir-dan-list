/**
 * Unit Tests for LaporanPengeluaranTab Component
 * Tests the expense report tab component including rendering, data display, and export functionality
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LaporanPengeluaranTab from "../../components/laporan/LaporanPengeluaranTab";

// Mock XLSX library
jest.mock("xlsx", () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    aoa_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

// Mock alert dialog provider
jest.mock("@/components/ui/alert-dialog-provider", () => ({
  useAlertDialog: () => ({
    showAlert: jest.fn(),
  }),
}));

// Mock UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
}));

jest.mock("@/components/ui/table", () => ({
  Table: ({ children }) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }) => (
    <tbody data-testid="table-body">{children}</tbody>
  ),
  TableCell: ({ children }) => <td data-testid="table-cell">{children}</td>,
  TableHead: ({ children }) => <th data-testid="table-head">{children}</th>,
  TableHeader: ({ children }) => (
    <thead data-testid="table-header">{children}</thead>
  ),
  TableRow: ({ children }) => <tr data-testid="table-row">{children}</tr>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }) => (
    <button data-testid="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children }) => (
    <div data-testid="collapsible">{children}</div>
  ),
  CollapsibleContent: ({ children }) => (
    <div data-testid="collapsible-content">{children}</div>
  ),
  CollapsibleTrigger: ({ children }) => (
    <div data-testid="collapsible-trigger">{children}</div>
  ),
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronDown: () => <div data-testid="chevron-down">↓</div>,
  ChevronRight: () => <div data-testid="chevron-right">→</div>,
  TrendingUp: () => <div data-testid="trending-up">↗</div>,
  TrendingDown: () => <div data-testid="trending-down">↘</div>,
  DollarSign: () => <div data-testid="dollar-sign">$</div>,
  FileText: () => <div data-testid="file-text">📄</div>,
  Download: () => <div data-testid="download">⬇</div>,
}));

describe("LaporanPengeluaranTab Component", () => {
  const mockDateRange = {
    from: new Date("2025-11-01"),
    to: new Date("2025-11-30"),
  };

  const mockData = {
    summary: {
      totalAmount: 5200000,
      totalExpenses: 4,
      categoriesCount: 3,
    },
    data: [
      {
        category: "BBM",
        totalAmount: 900000,
        count: 2,
        expenses: [
          {
            id: "exp-1",
            date: "2025-11-01",
            category: "BBM",
            description: "Bensin Armada Toyota Avanza",
            amount: 500000,
            namaPenerima: "John Doe",
            armada: { license_plate: "B 1234 ABC" },
            driver: null,
            staff: null,
          },
          {
            id: "exp-3",
            date: "2025-11-05",
            category: "BBM",
            description: "Bensin Armada Honda Jazz",
            amount: 400000,
            namaPenerima: "Jane Smith",
            armada: { license_plate: "B 5678 DEF" },
            driver: null,
            staff: null,
          },
        ],
      },
      {
        category: "GAJI_SOPIR",
        totalAmount: 2500000,
        count: 1,
        expenses: [
          {
            id: "exp-2",
            date: "2025-11-01",
            category: "GAJI_SOPIR",
            description: "Gaji Sopir Bulan November",
            amount: 2500000,
            namaPenerima: "Bob Wilson",
            armada: null,
            driver: { driver_name: "Bob Wilson" },
            staff: null,
          },
        ],
      },
    ],
  };

  describe("Loading State", () => {
    it("should render skeleton when loading", () => {
      render(
        <LaporanPengeluaranTab
          data={null}
          isLoading={true}
          dateRange={mockDateRange}
        />
      );

      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    });
  });

  describe("No Data State", () => {
    it("should render empty state when no data", () => {
      render(
        <LaporanPengeluaranTab
          data={null}
          isLoading={false}
          dateRange={mockDateRange}
        />
      );

      expect(
        screen.getByText("Tidak ada data pengeluaran untuk periode ini")
      ).toBeInTheDocument();
    });
  });

  describe("Data Display", () => {
    beforeEach(() => {
      render(
        <LaporanPengeluaranTab
          data={mockData}
          isLoading={false}
          dateRange={mockDateRange}
        />
      );
    });

    it("should display summary statistics", () => {
      expect(screen.getByText("4")).toBeInTheDocument(); // total expenses
      expect(screen.getByText("Rp 5.200.000")).toBeInTheDocument(); // total amount
      expect(screen.getByText("3")).toBeInTheDocument(); // categories count
    });

    it("should display category breakdown", () => {
      expect(screen.getByText("BBM (Armada)")).toBeInTheDocument();
      expect(screen.getByText("GAJI_SOPIR")).toBeInTheDocument();
      expect(screen.getByText("Rp 900.000")).toBeInTheDocument(); // BBM total
      expect(screen.getByText("Rp 2.500.000")).toBeInTheDocument(); // GAJI_SOPIR total
    });

    it("should display expense details in table", () => {
      expect(
        screen.getByText("Bensin Armada Toyota Avanza")
      ).toBeInTheDocument();
      expect(screen.getByText("Gaji Sopir Bulan November")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument(); // nama penerima
      expect(screen.getByText("B 1234 ABC")).toBeInTheDocument(); // license plate
    });
  });

  describe("Category Formatting", () => {
    it("should format categories correctly", () => {
      const {
        formatCategory,
      } = require("../../components/laporan/LaporanPengeluaranTab");

      expect(formatCategory("BBM")).toBe("BBM (Armada)");
      expect(formatCategory("GAJI_STAF_ADMIN")).toBe("Gaji Staf Admin");
      expect(formatCategory("UNKNOWN")).toBe("UNKNOWN");
    });

    it("should get correct category colors", () => {
      const {
        getCategoryColor,
      } = require("../../components/laporan/LaporanPengeluaranTab");

      expect(getCategoryColor("BBM")).toBe("bg-emerald-100 text-emerald-800");
      expect(getCategoryColor("GAJI_SOPIR")).toBe("bg-rose-100 text-rose-800");
      expect(getCategoryColor("UNKNOWN")).toBe("bg-gray-100 text-gray-800");
    });
  });

  describe("Currency Formatting", () => {
    it("should format currency correctly", () => {
      const {
        formatCurrency,
      } = require("../../components/laporan/LaporanPengeluaranTab");

      expect(formatCurrency(1000000)).toBe("Rp 1.000.000");
      expect(formatCurrency(500000)).toBe("Rp 500.000");
      expect(formatCurrency(0)).toBe("Rp 0");
    });
  });

  describe("Export Functionality", () => {
    it("should render export button", () => {
      render(
        <LaporanPengeluaranTab
          data={mockData}
          isLoading={false}
          dateRange={mockDateRange}
        />
      );

      const exportButton = screen.getByTestId("button");
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toHaveTextContent("Export ke Excel");
    });

    it("should call export function when button is clicked", async () => {
      const mockShowAlert = jest.fn();
      require("@/components/ui/alert-dialog-provider").useAlertDialog.mockReturnValue(
        {
          showAlert: mockShowAlert,
        }
      );

      render(
        <LaporanPengeluaranTab
          data={mockData}
          isLoading={false}
          dateRange={mockDateRange}
        />
      );

      const exportButton = screen.getByTestId("button");
      fireEvent.click(exportButton);

      // Wait for the export to complete
      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith({
          message: expect.stringContaining("File Excel berhasil diekspor"),
          type: "success",
          title: "Export Berhasil",
        });
      });
    });
  });

  describe("Collapsible Categories", () => {
    it("should render multiple collapsible categories", () => {
      render(
        <LaporanPengeluaranTab
          data={mockData}
          isLoading={false}
          dateRange={mockDateRange}
        />
      );

      // Should have multiple collapsible elements (one for each category)
      const collapsibles = screen.getAllByTestId("collapsible");
      expect(collapsibles).toHaveLength(2); // BBM and GAJI_SOPIR categories

      // Should have multiple triggers
      const triggers = screen.getAllByTestId("collapsible-trigger");
      expect(triggers).toHaveLength(2);
    });

    it("should display category names in triggers", () => {
      render(
        <LaporanPengeluaranTab
          data={mockData}
          isLoading={false}
          dateRange={mockDateRange}
        />
      );

      expect(screen.getByText("BBM (Armada)")).toBeInTheDocument();
      expect(screen.getByText("Gaji Sopir")).toBeInTheDocument();
    });
  });
});
