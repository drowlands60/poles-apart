import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => ({ data: { user: { id: "test-user" } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
    })),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Soft delete actions", () => {
  it("deleteCustomer action exists and is a function", async () => {
    const { deleteCustomer } = await import("@/app/dashboard/customers/actions");
    expect(deleteCustomer).toBeDefined();
    expect(typeof deleteCustomer).toBe("function");
  });

  it("deleteRound action exists and is a function", async () => {
    const { deleteRound } = await import("@/app/dashboard/rounds/actions");
    expect(deleteRound).toBeDefined();
    expect(typeof deleteRound).toBe("function");
  });

  it("deleteRun action exists and is a function", async () => {
    const { deleteRun } = await import("@/app/dashboard/runs/actions");
    expect(deleteRun).toBeDefined();
    expect(typeof deleteRun).toBe("function");
  });
});

describe("Ad-hoc charge actions", () => {
  it("createAdhocCharge action exists", async () => {
    const { createAdhocCharge } = await import("@/app/dashboard/payments/actions");
    expect(createAdhocCharge).toBeDefined();
    expect(typeof createAdhocCharge).toBe("function");
  });

  it("markAdhocPaid action exists", async () => {
    const { markAdhocPaid } = await import("@/app/dashboard/payments/actions");
    expect(markAdhocPaid).toBeDefined();
    expect(typeof markAdhocPaid).toBe("function");
  });

  it("markAdhocUnpaid action exists", async () => {
    const { markAdhocUnpaid } = await import("@/app/dashboard/payments/actions");
    expect(markAdhocUnpaid).toBeDefined();
    expect(typeof markAdhocUnpaid).toBe("function");
  });
});

describe("Run actions - new additions", () => {
  it("addNewCustomerToRun action exists", async () => {
    const { addNewCustomerToRun } = await import("@/app/dashboard/runs/actions");
    expect(addNewCustomerToRun).toBeDefined();
    expect(typeof addNewCustomerToRun).toBe("function");
  });

  it("completeRun action exists", async () => {
    const { completeRun } = await import("@/app/dashboard/round-view/actions");
    expect(completeRun).toBeDefined();
    expect(typeof completeRun).toBe("function");
  });

  it("reorderRunCustomers action exists", async () => {
    const { reorderRunCustomers } = await import("@/app/dashboard/round-view/actions");
    expect(reorderRunCustomers).toBeDefined();
    expect(typeof reorderRunCustomers).toBe("function");
  });
});
