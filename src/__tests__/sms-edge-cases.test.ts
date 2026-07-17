import { describe, it, expect } from "vitest";
import { buildDayBeforeMessage, buildCompletedMessage } from "@/lib/sms";

describe("SMS message edge cases", () => {
  it("buildDayBeforeMessage handles different dates correctly", () => {
    const msg = buildDayBeforeMessage("Karen", "2026-12-25");
    expect(msg).toContain("Hi Karen");
    expect(msg).toContain("Friday");
    expect(msg).toContain("25 December");
  });

  it("buildCompletedMessage handles small amounts", () => {
    const msg = buildCompletedMessage("Bob", 5);
    expect(msg).toContain("£5.00");
  });

  it("buildCompletedMessage handles large amounts", () => {
    const msg = buildCompletedMessage("Alice", 150.5);
    expect(msg).toContain("£150.50");
  });
});
