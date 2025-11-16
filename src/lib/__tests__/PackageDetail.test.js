/**
 * Unit Tests for PackageDetail Component
 * Tests the package detail dialog component including data display and formatting
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PackageDetail } from "../../components/packages/PackageDetail";

// Mock UI components
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }) =>
    open ? (
      <div data-testid="dialog" onClick={() => onOpenChange(false)}>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children, className }) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }) => (
    <div data-testid="dialog-title">{children}</div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, ...props }) => (
    <span data-testid={`badge-${variant || "default"}`} {...props}>
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, ...props }) => (
    <div data-testid="tabs" {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }) => (
    <button data-testid={`tab-trigger-${value}`}>{children}</button>
  ),
  TabsContent: ({ children, value }) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Hotel: () => <span data-testid="hotel-icon">🏨</span>,
  Map: () => <span data-testid="map-icon">🗺</span>,
}));

describe("PackageDetail Component", () => {
  const mockOnOpenChange = jest.fn();

  const mockPackage = {
     id: "pkg-1",
     name: "Paket Tour Bali Deluxe",
     type: "TOUR_PACKAGE",
     description:
       "Paket tour premium ke Bali dengan akomodasi bintang 5 dan transportasi VIP",
     price: 5000000,
     durationDays: 4,
     durationNights: 3,
     hotelTiers: [
       {
         id: "tier-1",
         starRating: 5,
         hotels: [
           { id: "h1", name: "Ayodya Resort Bali" },
           { id: "h2", name: "St. Regis Bali Resort" },
         ],
         priceRanges: [
           { id: "pr1", minPax: 1, maxPax: 2, price: 3000000 },
           { id: "pr2", minPax: 3, maxPax: 5, price: 2800000 },
         ],
       },
       {
         id: "tier-2",
         starRating: 4,
         hotels: [
           { id: "h3", name: "The Laguna, a Luxury Collection Resort" },
           { id: "h4", name: "Mulia Resort" },
         ],
         priceRanges: [
           { id: "pr3", minPax: 1, maxPax: 2, price: 2500000 },
           { id: "pr4", minPax: 3, maxPax: 5, price: 2300000 },
         ],
       },
     ],
     itineraries: [
       {
         id: "it1",
         day: 1,
         title: "Kedatangan di Bandara Ngurah Rai, transfer ke hotel, check-in dan istirahat",
         description: "Transfer dari bandara ke hotel dengan guide lokal",
       },
       {
         id: "it2",
         day: 2,
         title: "Sarapan pagi, tour ke Tanah Lot, Ubud Monkey Forest, dan Tegallalang Rice Terrace",
         description: "Tur komprehensif ke atraksi utama Bali",
       },
       {
         id: "it3",
         day: 3,
         title: "Aktivitas bebas di pantai, spa treatment, dan kuliner khas Bali",
         description: "Waktu bebas untuk relaksasi dan eksplorasi",
       },
       {
         id: "it4",
         day: 4,
         title: "Sarapan pagi, check-out hotel, transfer ke bandara, kembali ke Jakarta",
         description: "Transfer kembali ke bandara untuk penerbangan pulang",
       },
     ],
     isCustomizable: true,
     customizableItems: ["Upgrade Hotel", "Extra Meal", "Private Guide"],
   };

  const mockCarPackage = {
     id: "pkg-2",
     name: "Sewa Mobil Toyota Avanza",
     type: "CAR_RENTAL",
     description: "Sewa mobil Toyota Avanza dengan supir untuk keperluan wisata",
     price: 450000,
     durationHours: 12,
   };

  const mockFullDayTripPackage = {
     id: "pkg-3",
     name: "Full Day Trip Yogyakarta",
     type: "FULL_DAY_TRIP",
     description: "Tur sehari penuh menjelajahi Yogyakarta",
     price: 750000,
     overtimeRate: 50000,
     durationHours: 12,
     itineraries: [
       {
         id: "it1",
         day: 1,
         title: "Penjemputan di hotel dan perjalanan ke Borobudur",
         description: "Perjalanan pagi ke candi Borobudur",
       },
       {
         id: "it2",
         day: 1,
         title: "Eksplorasi Candi Prambanan dan Malioboro",
         description: "Tur ke candi Prambanan dan berbelanja di Malioboro",
       },
     ],
   };

  describe("Rendering", () => {
    it("should not render when package is null", () => {
      const { container } = render(
        <PackageDetail open={true} onOpenChange={mockOnOpenChange} pkg={null} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should not render dialog when open is false", () => {
      render(
        <PackageDetail
          open={false}
          onOpenChange={mockOnOpenChange}
          pkg={mockPackage}
        />
      );

      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("should render dialog when open is true and package exists", () => {
      render(
        <PackageDetail
          open={true}
          onOpenChange={mockOnOpenChange}
          pkg={mockPackage}
        />
      );

      expect(screen.getByTestId("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    });
  });

  describe("Package Information Display", () => {
    beforeEach(() => {
      render(
        <PackageDetail
          open={true}
          onOpenChange={mockOnOpenChange}
          pkg={mockPackage}
        />
      );
    });

    it("should display package name as dialog title", () => {
      expect(screen.getByTestId("dialog-title")).toHaveTextContent(
        "Paket Tour Bali Deluxe"
      );
    });

    it("should display package type", () => {
      expect(screen.getByText("Paket Tour")).toBeInTheDocument();
    });

    it("should display formatted price", () => {
      expect(screen.getByText("Rp 5.000.000")).toBeInTheDocument();
    });

    it("should display duration for tour packages", () => {
      expect(screen.getByText("4 Hari 3 Malam")).toBeInTheDocument();
    });

    it("should display description", () => {
      expect(
        screen.getByText(
          "Paket tour premium ke Bali dengan akomodasi bintang 5 dan transportasi VIP"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Car Rental Package", () => {
     it("should display duration for car rental packages", () => {
       render(
         <PackageDetail
           open={true}
           onOpenChange={mockOnOpenChange}
           pkg={mockCarPackage}
         />
       );

       expect(screen.getByText("Sewa Mobil Toyota Avanza")).toBeInTheDocument();
       expect(screen.getByText("Rp 450.000")).toBeInTheDocument();
       expect(screen.getByText("12 Jam")).toBeInTheDocument();
     });
   });

   describe("Full Day Trip Package", () => {
     it("should display full day trip package details", () => {
       render(
         <PackageDetail
           open={true}
           onOpenChange={mockOnOpenChange}
           pkg={mockFullDayTripPackage}
         />
       );

       expect(screen.getByText("Full Day Trip Yogyakarta")).toBeInTheDocument();
       expect(screen.getByText("Full Day Trip")).toBeInTheDocument();
       expect(screen.getByText("1 Hari")).toBeInTheDocument();
       expect(screen.getByText("Rp 750.000")).toBeInTheDocument();
       expect(screen.getByText("Rp 50.000/jam")).toBeInTheDocument();
       expect(screen.getByText("Itinerary Full Day Trip")).toBeInTheDocument();
       expect(screen.getAllByText("Hari ke-1")).toHaveLength(2);
       expect(screen.getByText("Penjemputan di hotel dan perjalanan ke Borobudur")).toBeInTheDocument();
     });
   });

  describe("Hotel Information", () => {
    it("should display hotel tiers for tour packages", () => {
      render(
        <PackageDetail
          open={true}
          onOpenChange={mockOnOpenChange}
          pkg={mockPackage}
        />
      );

      expect(screen.getByText("Bintang 5")).toBeInTheDocument();
      expect(screen.getByText("Bintang 4")).toBeInTheDocument();
      expect(
        screen.getByText((content, element) => content.includes("Rp 3.000.000"))
      ).toBeInTheDocument();
      expect(
        screen.getByText((content, element) => content.includes("Rp 2.500.000"))
      ).toBeInTheDocument();
    });

    it("should display hotel names", () => {
      render(
        <PackageDetail
          open={true}
          onOpenChange={mockOnOpenChange}
          pkg={mockPackage}
        />
      );

      expect(screen.getByText("Ayodya Resort Bali")).toBeInTheDocument();
      expect(screen.getByText("St. Regis Bali Resort")).toBeInTheDocument();
    });
  });

  describe("Itinerary Display", () => {
    it("should display itinerary days and activities", () => {
      render(
        <PackageDetail
          open={true}
          onOpenChange={mockOnOpenChange}
          pkg={mockPackage}
        />
      );

      expect(screen.getByText("Hari ke-1")).toBeInTheDocument();
      expect(screen.getByText("Hari ke-2")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Kedatangan di Bandara Ngurah Rai, transfer ke hotel, check-in dan istirahat"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Customizable Items", () => {
    it("should display customizable items when package is customizable", () => {
      render(
        <PackageDetail
          open={true}
          onOpenChange={mockOnOpenChange}
          pkg={mockPackage}
        />
      );

      expect(screen.getByText("Upgrade Hotel")).toBeInTheDocument();
      expect(screen.getByText("Extra Meal")).toBeInTheDocument();
      expect(screen.getByText("Private Guide")).toBeInTheDocument();
    });
  });

  describe("Currency Formatting", () => {
    it("should format currency correctly", () => {
      const {
        formatCurrency,
      } = require("../../components/packages/PackageDetail");

      expect(formatCurrency(1000000)).toBe("Rp 1.000.000");
      expect(formatCurrency(500000)).toBe("Rp 500.000");
      expect(formatCurrency(0)).toBe("-");
      expect(formatCurrency(null)).toBe("-");
      expect(formatCurrency(undefined)).toBe("-");
    });

    it("should handle invalid currency values", () => {
      const {
        formatCurrency,
      } = require("../../components/packages/PackageDetail");

      expect(formatCurrency("invalid")).toBe("invalid");
      expect(formatCurrency(NaN)).toBe("NaN");
    });
  });

  describe("Text Truncation", () => {
    it("should truncate long text", () => {
      const { takeWords } = require("../../components/packages/PackageDetail");

      const longText =
        "This is a very long text that should be truncated because it has more than twenty words in total length";
      const result = takeWords(longText, 10);
      expect(result).toBe(
        "This is a very long text that should be truncated..."
      );
    });

    it("should not truncate short text", () => {
      const { takeWords } = require("../../components/packages/PackageDetail");

      const shortText = "This is short";
      const result = takeWords(shortText, 10);
      expect(result).toBe("This is short");
    });

    it("should handle null/undefined text", () => {
      const { takeWords } = require("../../components/packages/PackageDetail");

      expect(takeWords(null)).toBe("-");
      expect(takeWords(undefined)).toBe("-");
      expect(takeWords("")).toBe("-");
    });
  });

  describe("Tabs", () => {
    it("should render tabs for tour packages", () => {
      render(
        <PackageDetail
          open={true}
          onOpenChange={mockOnOpenChange}
          pkg={mockPackage}
        />
      );

      expect(screen.getByTestId("tabs")).toBeInTheDocument();
      expect(screen.getByTestId("tab-trigger-hotel")).toBeInTheDocument();
      expect(screen.getByTestId("tab-trigger-itinerary")).toBeInTheDocument();
    });

    it("should not render hotel tab for car rental packages", () => {
      render(
        <PackageDetail
          open={true}
          onOpenChange={mockOnOpenChange}
          pkg={mockCarPackage}
        />
      );

      expect(screen.queryByTestId("tab-trigger-hotel")).not.toBeInTheDocument();
    });
  });

  describe("Package Type Detection", () => {
    it("should detect car rental packages correctly", () => {
      render(
        <PackageDetail
          open={true}
          onOpenChange={mockOnOpenChange}
          pkg={{ ...mockCarPackage, type: "CAR_RENTAL" }}
        />
      );

      // Should not show hotel tab for car rentals
      expect(screen.queryByTestId("tab-trigger-hotel")).not.toBeInTheDocument();
    });

    it("should detect tour packages correctly", () => {
      render(
        <PackageDetail
          open={true}
          onOpenChange={mockOnOpenChange}
          pkg={{ ...mockPackage, type: "TOUR_PACKAGE" }}
        />
      );

      expect(screen.getByTestId("tab-trigger-hotel")).toBeInTheDocument();
      expect(screen.getByTestId("tab-trigger-itinerary")).toBeInTheDocument();
    });
  });
});
