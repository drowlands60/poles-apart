import { describe, it, expect, vi } from "vitest";

// Mock supabase admin client
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

describe("Backup API route", () => {
  it("module exports a GET handler", async () => {
    const mod = await import("@/app/api/backup/route");
    expect(mod.GET).toBeDefined();
    expect(typeof mod.GET).toBe("function");
  });

  it("rejects requests without valid token", async () => {
    const mod = await import("@/app/api/backup/route");
    const request = new Request("http://localhost:3002/api/backup?token=wrong");
    const response = await mod.GET(request);
    expect(response.status).toBe(401);
  });
});
