"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createRun(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const roundId = (formData.get("round_id") as string) || null;
  const name = formData.get("name") as string;
  const scheduledDate = formData.get("scheduled_date") as string;
  const cleanerIds = formData.getAll("cleaner_ids") as string[];

  // Create the run
  const { data: run, error } = await supabase
    .from("runs")
    .insert({
      round_id: roundId,
      name,
      scheduled_date: scheduledDate,
    })
    .select()
    .single();

  if (error || !run) {
    return { error: error?.message ?? "Failed to create run" };
  }

  // Assign cleaners
  if (cleanerIds.length > 0) {
    const cleanerInserts = cleanerIds.map((cleanerId) => ({
      run_id: run.id,
      cleaner_id: cleanerId,
    }));
    await supabase.from("run_cleaners").insert(cleanerInserts);
  }

  // Copy customers from round template if a round was selected
  if (roundId) {
    const { data: templateCustomers } = await supabase
      .from("customers")
      .select("id, price, position_in_round")
      .eq("round_id", roundId)
      .eq("is_active", true)
      .order("position_in_round", { ascending: true });

    if (templateCustomers && templateCustomers.length > 0) {
      const customerInserts = templateCustomers.map((c, i) => ({
        run_id: run.id,
        customer_id: c.id,
        position: c.position_in_round ?? i + 1,
        price: c.price,
      }));
      await supabase.from("run_customers").insert(customerInserts);
    }
  }

  revalidatePath("/dashboard/runs");
  redirect(`/dashboard/runs/${run.id}`);
}

export async function updateRun(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const name = formData.get("name") as string;
  const scheduledDate = formData.get("scheduled_date") as string;
  const status = formData.get("status") as string;
  const cleanerIds = formData.getAll("cleaner_ids") as string[];

  const { error } = await supabase
    .from("runs")
    .update({ name, scheduled_date: scheduledDate, status })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  // Replace cleaners
  await supabase.from("run_cleaners").delete().eq("run_id", id);
  if (cleanerIds.length > 0) {
    const cleanerInserts = cleanerIds.map((cleanerId) => ({
      run_id: id,
      cleaner_id: cleanerId,
    }));
    await supabase.from("run_cleaners").insert(cleanerInserts);
  }

  revalidatePath(`/dashboard/runs/${id}`);
  revalidatePath("/dashboard/runs");
  redirect(`/dashboard/runs/${id}`);
}

export async function deleteRun(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { error } = await supabase.from("runs").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/runs");
  redirect("/dashboard/runs");
}

export async function addCustomerToRun(runId: string, customerId: string, price: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Get next position
  const { data: existing } = await supabase
    .from("run_customers")
    .select("position")
    .eq("run_id", runId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? 0) + 1;

  const { error } = await supabase.from("run_customers").insert({
    run_id: runId,
    customer_id: customerId,
    position: nextPosition,
    price,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/runs/${runId}`);
}

export async function removeCustomerFromRun(runId: string, customerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { error } = await supabase
    .from("run_customers")
    .delete()
    .eq("run_id", runId)
    .eq("customer_id", customerId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/runs/${runId}`);
}
