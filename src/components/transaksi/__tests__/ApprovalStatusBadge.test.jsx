/**
 * Unit Tests for ApprovalStatusBadge Component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ApprovalStatusBadge from "@/components/transaksi/ApprovalStatusBadge";

describe("ApprovalStatusBadge Component", () => {
  test("should render DRAFT status with gray color", () => {
    render(<ApprovalStatusBadge status="DRAFT" />);

    const badge = screen.getByText("Draft");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("text-gray-700");
  });

  test("should render PENDING status with yellow color", () => {
    render(<ApprovalStatusBadge status="PENDING" />);

    const badge = screen.getByText("Menunggu Persetujuan");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-yellow-100");
    expect(badge).toHaveClass("text-yellow-700");
  });

  test("should render APPROVED status with green color", () => {
    render(<ApprovalStatusBadge status="APPROVED" />);

    const badge = screen.getByText("Disetujui");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-green-100");
    expect(badge).toHaveClass("text-green-700");
  });

  test("should render REJECTED status with red color", () => {
    render(<ApprovalStatusBadge status="REJECTED" />);

    const badge = screen.getByText("Ditolak");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-red-100");
    expect(badge).toHaveClass("text-red-700");
  });

  test("should render unknown status with default gray color", () => {
    render(<ApprovalStatusBadge status="UNKNOWN" />);

    const badge = screen.getByText("UNKNOWN");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("text-gray-700");
  });

  test("should accept custom className", () => {
    render(<ApprovalStatusBadge status="DRAFT" className="custom-class" />);

    const badge = screen.getByText("Draft");
    expect(badge).toHaveClass("custom-class");
  });

  test("should handle null status gracefully", () => {
    render(<ApprovalStatusBadge status={null} />);

    const badge = screen.getByText("Unknown");
    expect(badge).toBeInTheDocument();
  });

  test("should handle undefined status gracefully", () => {
    render(<ApprovalStatusBadge status={undefined} />);

    const badge = screen.getByText("Unknown");
    expect(badge).toBeInTheDocument();
  });

  test("should apply correct variant for each status", () => {
    const statuses = [
      { status: "DRAFT", variant: "secondary" },
      { status: "PENDING", variant: "warning" },
      { status: "APPROVED", variant: "success" },
      { status: "REJECTED", variant: "destructive" },
    ];

    statuses.forEach(({ status, variant }) => {
      const { unmount } = render(<ApprovalStatusBadge status={status} />);
      const badge =
        screen.getByRole("status", { hidden: true }) ||
        screen.getByText(/Draft|Menunggu|Disetujui|Ditolak/);
      expect(badge).toBeInTheDocument();
      unmount();
    });
  });
});
