"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function markAsPaid(runId: string, customerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  await supabase
    .from("run_customers")
    .update({ paid: true, paid_at: new Date().toISOString() })
    .eq("run_id", runId)
    .eq("customer_id", customerId);

  revalidatePath("/dashboard/payments");
}

export async function markAsUnpaid(runId: string, customerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  await supabase
    .from("run_customers")
    .update({ paid: false, paid_at: null })
    .eq("run_id", runId)
    .eq("customer_id", customerId);

  revalidatePath("/dashboard/payments");
}

export async function markAllPaidForCustomer(customerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  await supabase
    .from("run_customers")
    .update({ paid: true, paid_at: new Date().toISOString() })
    .eq("customer_id", customerId)
    .eq("status", "completed")
    .eq("paid", false);

  revalidatePath("/dashboard/payments");
}
