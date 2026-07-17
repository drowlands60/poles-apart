"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendSms, buildDayBeforeMessage, buildCompletedMessage } from "@/lib/sms";

export async function sendDayBeforeNotifications(runId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Get the run details
  const { data: run } = await supabase
    .from("runs")
    .select("scheduled_date")
    .eq("id", runId)
    .single();
  if (!run) return { error: "Run not found" };

  // Get customers in this run who have sms_opt_in and a phone number
  const { data: runCustomers } = await supabase
    .from("run_customers")
    .select("customer_id, customers(id, first_name, last_name, phone, sms_opt_in)")
    .eq("run_id", runId)
    .eq("status", "pending");

  if (!runCustomers || runCustomers.length === 0) {
    return { error: "No customers to notify" };
  }

  const adminSupabase = createAdminClient();
  let sent = 0;
  let skipped = 0;
  const details: { name: string; status: "sent" | "skipped"; reason?: string }[] = [];

  for (const rc of runCustomers) {
    const customer = rc.customers as unknown as { id: string; first_name: string; last_name: string; phone: string | null; sms_opt_in: boolean } | null;
    const name = `${customer?.first_name ?? "?"} ${customer?.last_name ?? "?"}`;

    if (!customer?.phone) {
      skipped++;
      details.push({ name, status: "skipped", reason: "no phone" });
      continue;
    }
    if (!customer.sms_opt_in) {
      skipped++;
      details.push({ name, status: "skipped", reason: "opted out" });
      continue;
    }

    const body = buildDayBeforeMessage(customer.first_name, run.scheduled_date);
    const result = await sendSms(customer.phone, body);

    // Log to sms_log
    await adminSupabase.from("sms_log").insert({
      customer_id: customer.id,
      message_type: "day_before",
      message_body: body,
      phone_number: customer.phone,
      status: result.success ? "sent" : "failed",
      sent_at: result.success ? new Date().toISOString() : null,
      error_message: result.error ?? null,
    });

    if (result.success) {
      sent++;
      details.push({ name, status: "sent" });
    } else {
      skipped++;
      details.push({ name, status: "skipped", reason: "send failed" });
    }
  }

  revalidatePath(`/dashboard/runs/${runId}`);
  return { sent, skipped, total: runCustomers.length, details };
}

export async function sendCompletedNotifications(runId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Get completed customers in this run with sms_opt_in
  const { data: runCustomers } = await supabase
    .from("run_customers")
    .select("customer_id, price, customers(id, first_name, last_name, phone, sms_opt_in)")
    .eq("run_id", runId)
    .eq("status", "completed");

  if (!runCustomers || runCustomers.length === 0) {
    return { error: "No completed customers to notify" };
  }

  const adminSupabase = createAdminClient();
  let sent = 0;
  let skipped = 0;
  const details: { name: string; status: "sent" | "skipped"; reason?: string }[] = [];

  for (const rc of runCustomers) {
    const customer = rc.customers as unknown as { id: string; first_name: string; last_name: string; phone: string | null; sms_opt_in: boolean } | null;
    const name = `${customer?.first_name ?? "?"} ${customer?.last_name ?? "?"}`;

    if (!customer?.phone) {
      skipped++;
      details.push({ name, status: "skipped", reason: "no phone" });
      continue;
    }
    if (!customer.sms_opt_in) {
      skipped++;
      details.push({ name, status: "skipped", reason: "opted out" });
      continue;
    }

    const body = buildCompletedMessage(customer.first_name, Number(rc.price));
    const result = await sendSms(customer.phone, body);

    // Log to sms_log
    await adminSupabase.from("sms_log").insert({
      customer_id: customer.id,
      message_type: "completed",
      message_body: body,
      phone_number: customer.phone,
      status: result.success ? "sent" : "failed",
      sent_at: result.success ? new Date().toISOString() : null,
      error_message: result.error ?? null,
    });

    if (result.success) {
      sent++;
      details.push({ name, status: "sent" });
    } else {
      skipped++;
      details.push({ name, status: "skipped", reason: "send failed" });
    }
  }

  revalidatePath(`/dashboard/runs/${runId}`);
  return { sent, skipped, total: runCustomers.length, details };
}
