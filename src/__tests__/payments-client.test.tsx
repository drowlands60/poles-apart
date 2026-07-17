import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock the actions
vi.mock("@/app/dashboard/payments/actions", () => ({
  markAsPaid: vi.fn(),
  markAsUnpaid: vi.fn(),
  markAllPaidForCustomer: vi.fn(),
}));

import { PaymentsClient } from "@/app/dashboard/payments/payments-client";

describe("PaymentsClient", () => {
  const mockDue = [
    {
      run_id: "run-1",
      customer_id: "cust-1",
      price: 18,
      runs: { name: "Monday Round", scheduled_date: "2026-07-17" },
      customers: { first_name: "Sarah", last_name: "Mitchell", address_line1: "14 Penhill Drive" },
    },
    {
      run_id: "run-1",
      customer_id: "cust-2",
      price: 22,
      runs: { name: "Monday Round", scheduled_date: "2026-07-17" },
      customers: { first_name: "James", last_name: "Porter", address_line1: "7 Beech Avenue" },
    },
  ];

  const mockReceived = [
    {
      run_id: "run-2",
      customer_id: "cust-3",
      price: 15,
      paid_at: "2026-07-15T10:00:00Z",
      runs: { name: "Tuesday Round", scheduled_date: "2026-07-15" },
      customers: { first_name: "Helen", last_name: "Cook", address_line1: "31 Pinehurst Road" },
    },
  ];

  it("renders due tab by default", () => {
    render(<PaymentsClient due={mockDue} received={mockReceived} />);
    expect(screen.getByText("Due (2)")).toBeInTheDocument();
    expect(screen.getByText("Received (1)")).toBeInTheDocument();
  });

  it("shows customer names in due list", () => {
    render(<PaymentsClient due={mockDue} received={mockReceived} />);
    expect(screen.getByText("Sarah Mitchell")).toBeInTheDocument();
  });

  it("shows price for individual item", () => {
    render(<PaymentsClient due={mockDue} received={mockReceived} />);
    // Individual line items show their price
    expect(screen.getAllByText("£18.00").length).toBeGreaterThan(0);
  });

  it("shows All Paid button per customer group", () => {
    render(<PaymentsClient due={mockDue} received={mockReceived} />);
    expect(screen.getAllByText("All Paid").length).toBeGreaterThan(0);
  });

  it("renders empty state when no payments due", () => {
    render(<PaymentsClient due={[]} received={[]} />);
    expect(screen.getByText("No payments outstanding.")).toBeInTheDocument();
  });
});
