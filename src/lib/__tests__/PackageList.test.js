/**
 * Unit Tests for PackageList Component
 * Tests the package list component including data display, formatting, and action handlers
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PackageList } from "../../components/packages/PackageList";

// Mock UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardContent: ({ children }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardFooter: ({ children }) => <div data-testid="card-footer">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, size, ...props }) => (
    <button
      data-testid={`button-${variant || "default"}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, ...props }) => (
    <span data-testid={`badge-${variant || "default"}`} {...props}>
      {children}
    </span>
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Eye: () => <span data-testid="eye-icon">👁</span>,
  Pencil: () => <span data-testid="pencil-icon">✏</span>,
  Trash2: () => <span data-testid="trash-icon">🗑</span>,
  Truck: () => <span data-testid="truck-icon">🚛</span>,
  Map: () => <span data-testid="map-icon">🗺</span>,
  Car: () => <span data-testid="car-icon">🚗</span>,
  Compass: () => <span data-testid="compass-icon">🧭</span>,
  Plane: () => <span data-testid="plane-icon">✈</span>,
  Settings: () => <span data-testid="settings-icon">⚙</span>,
  Clock: () => <span data-testid="clock-icon">🕐</span>,
  Hotel: () => <span data-testid="hotel-icon">🏨</span>,
}));

describe("PackageList Component", () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnView = jest.fn();

  const mockPackages = [
    {
      id: "pkg-1",
      name: "Paket Tour Bali",
      type: "TOUR_PACKAGE",
      description: "Paket tour ke Bali 3 hari 2 malam",
      price: 2500000,
      durationDays: 3,
      durationNights: 2,
      hotelTiers: [
        { tingkat: "Bintang 3", tarifPerPax: 1500000 },
        { tingkat: "Bintang 4", tarifPerPax: 2000000 },
      ],
      itinerary: [
        { hari: 1, aktivitas: "Kedatangan di Bali" },
        { hari: 2, aktivitas: "Tour ke pantai" },
        { hari: 3, aktivitas: "Kembali ke Jakarta" },
      ],
    },
    {
      id: "pkg-2",
      name: "Sewa Mobil Toyota Avanza",
      type: "CAR_RENTAL",
      description: "Sewa mobil Toyota Avanza untuk 24 jam",
      price: 350000,
      durationHours: 24,
    },
    {
      id: "pkg-3",
      name: "Full Day Trip Jakarta",
      type: "FULL_DAY_TRIP",
      description: "Trip sehari keliling Jakarta",
      price: 500000,
    },
  ];

  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
    mockOnView.mockClear();
  });

  describe("Empty State", () => {
    it("should display empty message when no packages", () => {
      render(
        <PackageList
          packages={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      );

      expect(screen.getByText("Belum ada paket")).toBeInTheDocument();
    });

    it("should display empty message when packages is null", () => {
      render(
        <PackageList
          packages={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      );

      expect(screen.getByText("Belum ada paket")).toBeInTheDocument();
    });
  });

  describe("Package Display", () => {
    beforeEach(() => {
      render(
        <PackageList
          packages={mockPackages}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      );
    });

    it("should render all packages as cards", () => {
      const cards = screen.getAllByTestId("card");
      expect(cards).toHaveLength(3);
    });

    it("should display package names", () => {
      expect(screen.getByText("Paket Tour Bali")).toBeInTheDocument();
      expect(screen.getByText("Sewa Mobil Toyota Avanza")).toBeInTheDocument();
      expect(screen.getByText("Full Day Trip Jakarta")).toBeInTheDocument();
    });

    it("should display package types correctly", () => {
      expect(screen.getByText("Paket Tour")).toBeInTheDocument();
      expect(screen.getByText("Sewa Mobil")).toBeInTheDocument();
      expect(screen.getByText("Full Day Trip")).toBeInTheDocument();
    });

    it("should display formatted prices", () => {
      expect(screen.getByText("Rp 2.500.000")).toBeInTheDocument();
      expect(screen.getByText("Rp 350.000")).toBeInTheDocument();
      expect(screen.getByText("Rp 500.000")).toBeInTheDocument();
    });

    it("should display duration for tour packages", () => {
      expect(screen.getByText("3 Hari 2 Malam")).toBeInTheDocument();
    });

    it("should display duration for car rental", () => {
      expect(screen.getByText("24 Jam")).toBeInTheDocument();
    });

    it("should display duration for full day trip", () => {
      expect(screen.getByText("1 Hari")).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    beforeEach(() => {
      render(
        <PackageList
          packages={mockPackages}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      );
    });

    it("should call onView when view button is clicked", () => {
      const viewButtons = screen.getAllByTestId("button-outline");
      const firstViewButton = viewButtons.find((button) =>
        button.textContent.includes("Detail")
      );
      fireEvent.click(firstViewButton);

      expect(mockOnView).toHaveBeenCalledWith(mockPackages[0]);
    });

    it("should call onEdit when edit button is clicked", () => {
      const editButtons = screen.getAllByTestId("pencil-icon");
      const editButton = editButtons[0].closest("button");
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockPackages[0]);
    });

    it("should call onDelete when delete button is clicked", () => {
      const deleteButtons = screen.getAllByTestId("trash-icon");
      const deleteButton = deleteButtons[0].closest("button");
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockPackages[0]);
    });
  });

  describe("Currency Formatting", () => {
    it("should format currency correctly", () => {
      const { fmt } = require("../../components/packages/PackageList");

      expect(fmt(1000000)).toBe("Rp\u00A01.000.000");
      expect(fmt(500000)).toBe("Rp\u00A0500.000");
      expect(fmt(0)).toBe("Rp\u00A00");
      expect(fmt(null)).toBe("-");
      expect(fmt(undefined)).toBe("-");
    });

    it("should handle invalid currency values", () => {
      const { fmt } = require("../../components/packages/PackageList");

      expect(fmt("invalid")).toBe("invalid");
      expect(fmt(NaN)).toBe("RpNaN");
    });
  });

  describe("Type Mapping", () => {
    it("should map package types correctly", () => {
      render(
        <PackageList
          packages={[
            { id: "1", name: "Test", type: "CAR_RENTAL" },
            { id: "2", name: "Test2", type: "FULL_DAY_TRIP" },
            { id: "3", name: "Test3", type: "TOUR_PACKAGE" },
            { id: "4", name: "Test4", type: "UNKNOWN" },
          ]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      );

      expect(screen.getByText("Sewa Mobil")).toBeInTheDocument();
      expect(screen.getByText("Full Day Trip")).toBeInTheDocument();
      expect(screen.getByText("Paket Tour")).toBeInTheDocument();
      expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
    });
  });

  describe("Hotel and Itinerary Info", () => {
    it("should display hotel tiers count", () => {
      render(
        <PackageList
          packages={[mockPackages[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      );

      expect(screen.getByText("2 Tingkat Hotel")).toBeInTheDocument();
    });

    it("should display itinerary days count", () => {
      render(
        <PackageList
          packages={[mockPackages[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      );

      expect(screen.getByText("3 Hari Itinerary")).toBeInTheDocument();
    });

    it("should handle missing hotel/itinerary data", () => {
      render(
        <PackageList
          packages={[
            {
              id: "1",
              name: "Simple Package",
              type: "TOUR_PACKAGE",
              price: 100000,
            },
          ]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      );

      expect(screen.getByText("0 Tingkat Hotel")).toBeInTheDocument();
      expect(screen.getByText("0 Hari Itinerary")).toBeInTheDocument();
    });
  });

  describe("Grid Layout", () => {
    it("should apply correct grid classes", () => {
      const { container } = render(
        <PackageList
          packages={mockPackages}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onView={mockOnView}
        />
      );

      const gridContainer = container.firstChild;
      expect(gridContainer).toHaveClass(
        "grid",
        "gap-4",
        "sm:grid-cols-2",
        "lg:grid-cols-3"
      );
    });
  });
});
