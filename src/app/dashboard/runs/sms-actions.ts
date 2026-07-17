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
      if (customer) {
        await adminSupabase.from("sms_log").insert({
          customer_id: customer.id,
          run_id: runId,
          message_type: "day_before",
          message_body: "",
          phone_number: "",
          status: "skipped",
          error_message: "no phone",
        });
      }
      continue;
    }
    if (!customer.sms_opt_in) {
      skipped++;
      details.push({ name, status: "skipped", reason: "opted out" });
      await adminSupabase.from("sms_log").insert({
        customer_id: customer.id,
        run_id: runId,
        message_type: "day_before",
        message_body: "",
        phone_number: customer.phone,
        status: "skipped",
        error_message: "opted out",
      });
      continue;
    }

    const body = buildDayBeforeMessage(customer.first_name, run.scheduled_date);
    const result = await sendSms(customer.phone, body);

    // Log to sms_log
    await adminSupabase.from("sms_log").insert({
      customer_id: customer.id,
      run_id: runId,
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
      await supabase.from("run_customers").update({ sms_day_before_sent: true }).eq("run_id", runId).eq("customer_id", customer.id);
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
      if (customer) {
        await adminSupabase.from("sms_log").insert({
          customer_id: customer.id,
          run_id: runId,
          message_type: "completed",
          message_body: "",
          phone_number: "",
          status: "skipped",
          error_message: "no phone",
        });
      }
      continue;
    }
    if (!customer.sms_opt_in) {
      skipped++;
      details.push({ name, status: "skipped", reason: "opted out" });
      await adminSupabase.from("sms_log").insert({
        customer_id: customer.id,
        run_id: runId,
        message_type: "completed",
        message_body: "",
        phone_number: customer.phone,
        status: "skipped",
        error_message: "opted out",
      });
      continue;
    }

    const body = buildCompletedMessage(customer.first_name, Number(rc.price));
    const result = await sendSms(customer.phone, body);

    // Log to sms_log
    await adminSupabase.from("sms_log").insert({
      customer_id: customer.id,
      run_id: runId,
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
      await supabase.from("run_customers").update({ sms_completed_sent: true }).eq("run_id", runId).eq("customer_id", customer.id);
    } else {
      skipped++;
      details.push({ name, status: "skipped", reason: "send failed" });
    }
  }

  revalidatePath(`/dashboard/runs/${runId}`);
  return { sent, skipped, total: runCustomers.length, details };
}

export async function sendSingleNotification(runId: string, customerId: string, type: "day_before" | "completed") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Admin only" };

  const { data: customer } = await supabase
    .from("customers")
    .select("id, first_name, phone, sms_opt_in")
    .eq("id", customerId)
    .single();

  if (!customer) return { error: "Customer not found" };
  if (!customer.phone) return { error: "No phone number" };
  if (!customer.sms_opt_in) return { error: "Customer opted out" };

  const { data: runCustomer } = await supabase
    .from("run_customers")
    .select("price")
    .eq("run_id", runId)
    .eq("customer_id", customerId)
    .single();

  if (!runCustomer) return { error: "Customer not in this run" };

  const { data: run } = await supabase
    .from("runs")
    .select("scheduled_date")
    .eq("id", runId)
    .single();

  if (!run) return { error: "Run not found" };

  const body = type === "day_before"
    ? buildDayBeforeMessage(customer.first_name, run.scheduled_date)
    : buildCompletedMessage(customer.first_name, Number(runCustomer.price));

  const result = await sendSms(customer.phone, body);

  if (!result.success) {
    return { error: result.error ?? "Send failed" };
  }

  const adminSupabase = createAdminClient();
  await adminSupabase.from("sms_log").insert({
    customer_id: customerId,
    run_id: runId,
    message_type: type,
    message_body: body,
    phone_number: customer.phone,
    status: "sent",
    sent_at: new Date().toISOString(),
  });

  const flagCol = type === "day_before" ? "sms_day_before_sent" : "sms_completed_sent";
  await supabase.from("run_customers").update({ [flagCol]: true }).eq("run_id", runId).eq("customer_id", customerId);

  revalidatePath(`/dashboard/runs/${runId}`);
  return { success: true };
}
