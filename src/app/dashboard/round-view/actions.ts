"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function markCustomerStatus(
  runId: string,
  customerId: string,
  status: "completed" | "skipped" | "pending",
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const updateData: Record<string, unknown> = { status };
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  } else if (status === "pending") {
    updateData.completed_at = null;
  }
  if (notes !== undefined) {
    updateData.notes = notes || null;
  }

  const { error } = await supabase
    .from("run_customers")
    .update(updateData)
    .eq("run_id", runId)
    .eq("customer_id", customerId);

  if (error) {
    return { error: error.message };
  }

  // Auto-set run to in_progress when first customer is done/skipped
  if (status === "completed" || status === "skipped") {
    await supabase
      .from("runs")
      .update({ status: "in_progress" })
      .eq("id", runId)
      .eq("status", "planned");
  }

  revalidatePath("/dashboard/round-view");
  revalidatePath("/dashboard/runs");
}

export async function addNoteToCustomer(
  runId: string,
  customerId: string,
  notes: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("run_customers")
    .update({ notes: notes || null })
    .eq("run_id", runId)
    .eq("customer_id", customerId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/round-view");
}

export async function reorderRunCustomers(
  runId: string,
  orderedCustomerIds: string[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Update positions for each customer
  for (let i = 0; i < orderedCustomerIds.length; i++) {
    await supabase
      .from("run_customers")
      .update({ position: i + 1 })
      .eq("run_id", runId)
      .eq("customer_id", orderedCustomerIds[i]);
  }

  revalidatePath("/dashboard/round-view");
}

export async function completeRun(runId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("runs")
    .update({ status: "completed" })
    .eq("id", runId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/round-view");
  revalidatePath("/dashboard/runs");
  revalidatePath("/dashboard/rounds");
}
