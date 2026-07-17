import { describe, it, expect, vi } from "vitest";
import { buildDayBeforeMessage, buildCompletedMessage, sendSms } from "@/lib/sms";

describe("SMS message builders", () => {
  it("buildDayBeforeMessage includes customer name and formatted date", () => {
    const msg = buildDayBeforeMessage("Sarah", "2026-07-21");
    expect(msg).toContain("Hi Sarah");
    expect(msg).toContain("Tuesday");
    expect(msg).toContain("21 July");
    expect(msg).toContain("Poles Apart");
  });

  it("buildCompletedMessage includes customer name and price", () => {
    const msg = buildCompletedMessage("James", 22.5);
    expect(msg).toContain("Hi James");
    expect(msg).toContain("£22.50");
    expect(msg).toContain("Payment");
    expect(msg).toContain("Poles Apart");
  });

  it("buildCompletedMessage formats whole number prices correctly", () => {
    const msg = buildCompletedMessage("Karen", 28);
    expect(msg).toContain("£28.00");
  });
});

describe("sendSms", () => {
  it("returns error when Twilio is not configured", async () => {
    // env vars are not set in test environment
    const result = await sendSms("07700100001", "Test message");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Twilio not configured");
  });
});
