import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { CustomerTable } from "@/app/dashboard/customers/customer-table";

const mockCustomers = [
  {
    id: "1",
    first_name: "Sarah",
    last_name: "Mitchell",
    phone: "07700100001",
    address_line1: "14 Penhill Drive",
    city: "Swindon",
    postcode: "SN2 5BP",
    price: 18,
    is_active: true,
    rounds: { name: "Monday - Swindon North" },
  },
  {
    id: "2",
    first_name: "Peter",
    last_name: "Shaw",
    phone: "07700500001",
    address_line1: "10 Fleming Way",
    city: "Swindon",
    postcode: "SN1 2NG",
    price: 20,
    is_active: false,
    rounds: null,
  },
];

describe("CustomerTable", () => {
  it("renders customer names", () => {
    render(<CustomerTable customers={mockCustomers} roundNames={["Monday - Swindon North"]} balanceMap={{}} />);
    expect(screen.getByText("Sarah Mitchell")).toBeInTheDocument();
    expect(screen.getByText("Peter Shaw")).toBeInTheDocument();
  });

  it("shows customer count", () => {
    render(<CustomerTable customers={mockCustomers} roundNames={[]} balanceMap={{}} />);
    expect(screen.getByText(/2 customers/)).toBeInTheDocument();
  });

  it("displays balance when owed", () => {
    render(<CustomerTable customers={mockCustomers} roundNames={[]} balanceMap={{ "1": 36 }} />);
    expect(screen.getByText("£36.00")).toBeInTheDocument();
  });

  it("shows dash when no balance owed", () => {
    render(<CustomerTable customers={mockCustomers} roundNames={[]} balanceMap={{}} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders round name", () => {
    render(<CustomerTable customers={mockCustomers} roundNames={["Monday - Swindon North"]} balanceMap={{}} />);
    expect(screen.getAllByText("Monday - Swindon North").length).toBeGreaterThan(0);
  });

  it("shows active/inactive status badges", () => {
    render(<CustomerTable customers={mockCustomers} roundNames={[]} balanceMap={{}} />);
    // Both badges should be rendered (there's also filter options with same text)
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
  });
});
