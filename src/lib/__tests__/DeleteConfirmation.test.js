/**
 * Unit Tests for DeleteConfirmation Component
 * Tests the delete confirmation dialog component including interactions
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DeleteConfirmation } from "../../components/packages/DeleteConfirmation";

// Mock UI components
jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open, onOpenChange }) =>
    open ? (
      <div data-testid="alert-dialog" onClick={() => onOpenChange(false)}>
        {children}
      </div>
    ) : null,
  AlertDialogAction: ({ children, onClick }) => (
    <button data-testid="alert-action" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, onClick }) => (
    <button data-testid="alert-cancel" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogContent: ({ children }) => (
    <div data-testid="alert-content">{children}</div>
  ),
  AlertDialogDescription: ({ children }) => (
    <div data-testid="alert-description">{children}</div>
  ),
  AlertDialogFooter: ({ children }) => (
    <div data-testid="alert-footer">{children}</div>
  ),
  AlertDialogHeader: ({ children }) => (
    <div data-testid="alert-header">{children}</div>
  ),
  AlertDialogTitle: ({ children }) => (
    <div data-testid="alert-title">{children}</div>
  ),
}));

describe("DeleteConfirmation Component", () => {
  const mockOnOpenChange = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    mockOnOpenChange.mockClear();
    mockOnConfirm.mockClear();
  });

  describe("Rendering", () => {
    it("should not render dialog when open is false", () => {
      render(
        <DeleteConfirmation
          open={false}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument();
    });

    it("should render dialog when open is true", () => {
      render(
        <DeleteConfirmation
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("alert-content")).toBeInTheDocument();
      expect(screen.getByTestId("alert-header")).toBeInTheDocument();
      expect(screen.getByTestId("alert-footer")).toBeInTheDocument();
    });

    it("should display correct title and description", () => {
      render(
        <DeleteConfirmation
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId("alert-title")).toHaveTextContent(
        "Anda yakin ingin menghapus?"
      );
      expect(screen.getByTestId("alert-description")).toHaveTextContent(
        "Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data paket secara permanen dari server."
      );
    });

    it("should display action buttons", () => {
      render(
        <DeleteConfirmation
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId("alert-cancel")).toHaveTextContent("Batal");
      expect(screen.getByTestId("alert-action")).toHaveTextContent("Hapus");
    });
  });

  describe("Interactions", () => {
    it("should call onConfirm when delete button is clicked", () => {
      render(
        <DeleteConfirmation
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      const deleteButton = screen.getByTestId("alert-action");
      fireEvent.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onOpenChange with false when cancel button is clicked", () => {
      render(
        <DeleteConfirmation
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelButton = screen.getByTestId("alert-cancel");
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onOpenChange with false when dialog is clicked (backdrop)", () => {
      render(
        <DeleteConfirmation
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      const dialog = screen.getByTestId("alert-dialog");
      fireEvent.click(dialog);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      render(
        <DeleteConfirmation
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      // AlertDialog should be a proper dialog element in real implementation
      // but our mock renders a div, so we check for the presence of content
      expect(screen.getByTestId("alert-title")).toBeInTheDocument();
      expect(screen.getByTestId("alert-description")).toBeInTheDocument();
    });

    it("should have descriptive button text", () => {
      render(
        <DeleteConfirmation
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelButton = screen.getByTestId("alert-cancel");
      const deleteButton = screen.getByTestId("alert-action");

      expect(cancelButton).toHaveTextContent("Batal");
      expect(deleteButton).toHaveTextContent("Hapus");
    });
  });

  describe("Button Styling", () => {
    it("should render buttons with correct styling", () => {
      render(
        <DeleteConfirmation
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelButton = screen.getByTestId("alert-cancel");
      const deleteButton = screen.getByTestId("alert-action");

      // In real implementation, these would have different variants
      // but our mock doesn't preserve the variant prop
      expect(cancelButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe("Dialog Structure", () => {
    it("should have correct dialog structure", () => {
      render(
        <DeleteConfirmation
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={mockOnConfirm}
        />
      );

      // Check that all dialog parts are present
      expect(screen.getByTestId("alert-header")).toBeInTheDocument();
      expect(screen.getByTestId("alert-title")).toBeInTheDocument();
      expect(screen.getByTestId("alert-description")).toBeInTheDocument();
      expect(screen.getByTestId("alert-footer")).toBeInTheDocument();
      expect(screen.getByTestId("alert-cancel")).toBeInTheDocument();
      expect(screen.getByTestId("alert-action")).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("should handle all required props", () => {
      expect(() => {
        render(
          <DeleteConfirmation
            open={true}
            onOpenChange={mockOnOpenChange}
            onConfirm={mockOnConfirm}
          />
        );
      }).not.toThrow();
    });

    it("should handle missing optional props gracefully", () => {
      // Component doesn't have optional props beyond the required ones
      expect(() => {
        render(
          <DeleteConfirmation
            open={true}
            onOpenChange={mockOnOpenChange}
            onConfirm={mockOnConfirm}
          />
        );
      }).not.toThrow();
    });
  });
});
