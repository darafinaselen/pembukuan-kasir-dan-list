/**
 * Unit Tests for PackageForm Component
 * Tests the complex package form with validation, field arrays, and different package types
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { PackageForm } from "../../components/packages/PackageForm";

// Mock all UI components
jest.mock("@/components/ui/form", () => ({
  Form: ({ children, ...props }) => <form {...props}>{children}</form>,
  FormField: ({ children }) => <div>{children}</div>,
  FormItem: ({ children }) => <div>{children}</div>,
  FormLabel: ({ children }) => <label>{children}</label>,
  FormControl: ({ children }) => <div>{children}</div>,
  FormMessage: ({ children }) => <div className="text-red-500">{children}</div>,
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogDescription: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h2>{children}</h2>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, type, ...props }) => (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }) => <input {...props} />,
}));

jest.mock("@/components/ui/currency-input", () => ({
  CurrencyInput: ({ ...props }) => <input type="number" {...props} />,
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children }) => <label>{children}</label>,
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: ({ ...props }) => <textarea {...props} />,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }) => (
    <div data-testid="select">
      <select value={value} onChange={(e) => onValueChange(e.target.value)}>
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ value, children }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }) => <div>{children}</div>,
  SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange }) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }) => (
    <div data-testid={`tab-${value}`}>{children}</div>
  ),
  TabsList: ({ children }) => <div>{children}</div>,
  TabsTrigger: ({ value, children }) => (
    <button data-testid={`tab-trigger-${value}`}>{children}</button>
  ),
}));

jest.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange, ...props }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...props}
    />
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

jest.mock("@/components/packages/HotelListInput", () => ({
  HotelListInput: ({ value, onChange }) => (
    <input
      data-testid="hotel-list-input"
      value={value?.join(", ") || ""}
      onChange={(e) => onChange(e.target.value.split(", "))}
    />
  ),
}));

// Mock react-hook-form
jest.mock("react-hook-form", () => ({
  useForm: jest.fn(),
  Controller: ({ render }) =>
    render({ field: { value: "", onChange: jest.fn() } }),
  useFieldArray: jest.fn(),
}));

// Mock lucide icons
jest.mock("lucide-react", () => ({
  Plus: () => <span>+</span>,
  Trash2: () => <span>🗑️</span>,
  Hotel: () => <span>🏨</span>,
  Map: () => <span>🗺️</span>,
  Settings: () => <span>⚙️</span>,
}));

// Mock utils
jest.mock("@/lib/utils", () => ({
  validatePriceRangesForTier: jest.fn(),
  getPriceRangeConflicts: jest.fn(),
}));

describe("PackageForm Component", () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnSubmit = jest.fn();

  const mockUseForm = {
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => (e) => {
      e.preventDefault();
      fn(mockFormData);
    }),
    reset: jest.fn(),
    control: {},
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
    setError: jest.fn(),
    clearErrors: jest.fn(),
    formState: {
      errors: {},
      isSubmitting: false,
    },
  };

  const mockUseFieldArray = {
    fields: [],
    append: jest.fn(),
    remove: jest.fn(),
  };

  let mockFormData;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormData = {
      namaPaket: "Test Package",
      tipePaket: "Sewa Mobil",
      deskripsi: "Test description",
      hargaDefault: 100000,
      tarifOvertime: 50000,
      isCustomizable: false,
      customizableItems: [],
      include: "Include items",
      exclude: "Exclude items",
    };

    // Setup mocks
    require("react-hook-form").useForm.mockReturnValue(mockUseForm);
    require("react-hook-form").useFieldArray.mockReturnValue(mockUseFieldArray);
    require("@/lib/utils").validatePriceRangesForTier.mockReturnValue({
      ok: true,
    });
    require("@/lib/utils").getPriceRangeConflicts.mockReturnValue({
      errors: [],
      overlaps: [],
    });
  });

  describe("Dialog State", () => {
    it("should not render when open is false", () => {
      render(
        <PackageForm
          open={false}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("should render when open is true", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId("dialog")).toBeInTheDocument();
      expect(screen.getByText("Tambah Paket")).toBeInTheDocument();
    });
  });

  describe("Form Fields", () => {
    it("should render basic form fields", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Nama Paket")).toBeInTheDocument();
      expect(screen.getByText("Tipe Paket")).toBeInTheDocument();
      expect(screen.getByText("Deskripsi")).toBeInTheDocument();
    });

    it("should show car rental fields for Sewa Mobil type", () => {
      mockUseForm.watch.mockReturnValue("Sewa Mobil");

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Harga Default")).toBeInTheDocument();
      expect(screen.getByText("Tarif Overtime")).toBeInTheDocument();
    });

    it("should show tour package fields for Paket Tour type", () => {
      mockUseForm.watch.mockReturnValue("Paket Tour");

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Durasi")).toBeInTheDocument();
      expect(screen.getByTestId("tab-hotel")).toBeInTheDocument();
      expect(screen.getByTestId("tab-itinerary")).toBeInTheDocument();
    });
  });

  describe("Package Type Selection", () => {
    it("should handle package type change", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "Paket Tour" } });

      expect(mockUseForm.watch).toHaveBeenCalledWith("tipePaket");
    });
  });

  describe("Customizable Items", () => {
    it("should show customizable items section when isCustomizable is true", () => {
      mockUseForm.watch.mockImplementation((field) => {
        if (field === "isCustomizable") return true;
        return "";
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(
        screen.getByText("Item yang Dapat Disesuaikan")
      ).toBeInTheDocument();
    });

    it("should not show customizable items section when isCustomizable is false", () => {
      mockUseForm.watch.mockImplementation((field) => {
        if (field === "isCustomizable") return false;
        return "";
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(
        screen.queryByText("Item yang Dapat Disesuaikan")
      ).not.toBeInTheDocument();
    });
  });

  describe("Hotel Tiers (Paket Tour)", () => {
    beforeEach(() => {
      mockUseForm.watch.mockReturnValue("Paket Tour");
      mockUseFieldArray.fields = [
        {
          id: "hotel-1",
          tingkat: "Bintang 3",
          tarifPerPax: 500000,
          daftarHotel: [],
        },
      ];
    });

    it("should render hotel tier fields", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId("tab-hotel")).toBeInTheDocument();
      expect(screen.getByTestId("hotel-list-input")).toBeInTheDocument();
    });

    it("should allow adding hotel tier", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const addButtons = screen.getAllByText("+");
      fireEvent.click(addButtons[0]); // Add hotel tier button

      expect(mockUseFieldArray.append).toHaveBeenCalled();
    });

    it("should allow removing hotel tier", () => {
      mockUseFieldArray.fields = [
        { id: "hotel-1", tingkat: "Bintang 3" },
        { id: "hotel-2", tingkat: "Bintang 4" },
      ];

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const removeButtons = screen.getAllByText("🗑️");
      fireEvent.click(removeButtons[0]);

      expect(mockUseFieldArray.remove).toHaveBeenCalledWith(0);
    });
  });

  describe("Itinerary (Paket Tour)", () => {
    beforeEach(() => {
      mockUseForm.watch.mockReturnValue("Paket Tour");
      mockUseFieldArray.fields = [
        { id: "itinerary-1", hari: 1, aktivitas: "Day 1 activity" },
      ];
    });

    it("should render itinerary fields", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId("tab-itinerary")).toBeInTheDocument();
      expect(screen.getByText("Tambah Hari")).toBeInTheDocument();
    });

    it("should allow adding itinerary day", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByText("Tambah Hari"));

      expect(mockUseFieldArray.append).toHaveBeenCalledWith({
        hari: 2,
        aktivitas: "",
      });
    });

    it("should allow removing itinerary day", () => {
      mockUseFieldArray.fields = [
        { id: "itinerary-1", hari: 1 },
        { id: "itinerary-2", hari: 2 },
      ];

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const removeButtons = screen.getAllByText("🗑️");
      fireEvent.click(removeButtons[1]); // Remove second itinerary

      expect(mockUseFieldArray.remove).toHaveBeenCalledWith(1);
    });
  });

  describe("Form Submission", () => {
    it("should call onSave when form is submitted successfully", async () => {
      mockUseForm.handleSubmit.mockImplementation((fn) => async (e) => {
        e.preventDefault();
        await fn(mockFormData);
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByText("Simpan");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it("should transform data correctly for Sewa Mobil type", async () => {
      mockFormData.tipePaket = "Sewa Mobil";

      mockUseForm.handleSubmit.mockImplementation((fn) => async (e) => {
        e.preventDefault();
        await fn(mockFormData);
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByText("Simpan"));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            namaPaket: "Test Package",
            tipePaket: "Sewa Mobil",
            hargaDefault: 100000,
            tarifOvertime: 50000,
          })
        );
      });
    });

    it("should transform data correctly for Paket Tour type", async () => {
      mockFormData.tipePaket = "Paket Tour";
      mockFormData.durasiHari = 3;
      mockFormData.durasiMalam = 2;
      mockFormData.tarifHotel = [{ tingkat: "Bintang 3", tarifPerPax: 500000 }];
      mockFormData.itinerary = [{ hari: 1, aktivitas: "Day 1" }];

      mockUseForm.handleSubmit.mockImplementation((fn) => async (e) => {
        e.preventDefault();
        await fn(mockFormData);
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByText("Simpan"));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            namaPaket: "Test Package",
            tipePaket: "Paket Tour",
            durasi: { hari: 3, malam: 2 },
            tarifHotel: [{ tingkat: "Bintang 3", tarifPerPax: 500000 }],
            itinerary: [{ hari: 1, aktivitas: "Day 1" }],
          })
        );
      });
    });

    it("should validate price ranges for Paket Tour", async () => {
      mockFormData.tipePaket = "Paket Tour";
      require("@/lib/utils").validatePriceRangesForTier.mockReturnValue({
        ok: false,
        message: "Invalid price ranges",
      });

      mockUseForm.handleSubmit.mockImplementation((fn) => async (e) => {
        e.preventDefault();
        await fn(mockFormData);
      });

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByText("Simpan"));

      await waitFor(() => {
        expect(mockUseForm.setError).toHaveBeenCalled();
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });
  });

  describe("Form Reset", () => {
    it("should reset form when package prop changes", () => {
      const { rerender } = render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      rerender(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          package_={{ id: "pkg-1", name: "Updated Package" }}
        />
      );

      expect(mockUseForm.reset).toHaveBeenCalled();
    });

    it("should reset form when defaultValues prop changes", () => {
      const { rerender } = render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      rerender(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          defaultValues={{ id: "pkg-1", name: "Default Package" }}
        />
      );

      expect(mockUseForm.reset).toHaveBeenCalled();
    });
  });

  describe("Dialog Actions", () => {
    it("should call onOpenChange with false when cancel button is clicked", () => {
      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      fireEvent.click(screen.getByText("Batal"));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should disable submit button when submitting", () => {
      mockUseForm.formState.isSubmitting = true;

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByText("Simpan");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should display form errors", () => {
      mockUseForm.formState.errors = {
        namaPaket: { message: "Nama paket wajib diisi" },
      };

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Nama paket wajib diisi")).toBeInTheDocument();
    });
  });

  describe("Data Transformation", () => {
    it("should transform package data from database format", () => {
      const dbPackage = {
        id: "pkg-1",
        name: "Test Package",
        type: "TOUR_PACKAGE",
        description: "Test description",
        durationDays: 3,
        durationNights: 2,
        isCustomizable: true,
        customizableItems: ["Item 1", "Item 2"],
        price: 100000,
        overtimeRate: 50000,
        includes: "Include items",
        excludes: "Exclude items",
        hotelTiers: [
          {
            starRating: 3,
            pricePerPax: 500000,
            hotels: [{ name: "Hotel A" }, { name: "Hotel B" }],
            priceRanges: [
              { minPax: 1, maxPax: 5, price: 500000 },
              { minPax: 6, maxPax: 10, price: 450000 },
            ],
          },
        ],
        itineraries: [
          { day: 1, title: "Day 1", description: "First day activities" },
          { day: 2, title: "Day 2", description: "Second day activities" },
        ],
      };

      render(
        <PackageForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          package_={dbPackage}
        />
      );

      expect(mockUseForm.reset).toHaveBeenCalled();
    });
  });
});
