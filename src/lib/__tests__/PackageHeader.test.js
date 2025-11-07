/**
 * Unit Tests for PackageHeader Component
 * Tests the package header component including rendering and button interactions
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PackageHeader from "../../components/packages/PackageHeader";

// Mock UI components
jest.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: ({ className }) => (
    <button data-testid="sidebar-trigger" className={className}>
      ☰
    </button>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }) => (
    <button data-testid="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  PlusCircle: () => <span data-testid="plus-circle">⊕</span>,
}));

describe("PackageHeader Component", () => {
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    mockOnAdd.mockClear();
  });

  describe("Rendering", () => {
    it("should render the header with correct title and description", () => {
      render(<PackageHeader onAdd={mockOnAdd} />);

      expect(screen.getByText("Manajemen Paket Jasa")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Buat dan kelola data master untuk paket sewa atau tour."
        )
      ).toBeInTheDocument();
    });

    it("should render sidebar trigger", () => {
      render(<PackageHeader onAdd={mockOnAdd} />);

      expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
    });

    it("should render add button with correct text and icon", () => {
      render(<PackageHeader onAdd={mockOnAdd} />);

      const button = screen.getByTestId("button");
      expect(button).toHaveTextContent("Tambah Paket");
      expect(screen.getByTestId("plus-circle")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onAdd when add button is clicked", () => {
      render(<PackageHeader onAdd={mockOnAdd} />);

      const button = screen.getByTestId("button");
      fireEvent.click(button);

      expect(mockOnAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<PackageHeader onAdd={mockOnAdd} />);

      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Manajemen Paket Jasa");
    });
  });

  describe("Styling", () => {
    it("should apply correct CSS classes", () => {
      const { container } = render(<PackageHeader onAdd={mockOnAdd} />);

      const header = container.firstChild;
      expect(header).toHaveClass("flex", "items-center", "gap-4", "p-4");

      const title = screen.getByText("Manajemen Paket Jasa");
      expect(title).toHaveClass("text-xl", "font-bold");

      const description = screen.getByText(
        "Buat dan kelola data master untuk paket sewa atau tour."
      );
      expect(description).toHaveClass(
        "text-sm",
        "text-muted-foreground",
        "mt-1"
      );
    });
  });
});
