"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createRound(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { error } = await supabase.from("rounds").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    day_of_week: formData.get("day_of_week") ? parseInt(formData.get("day_of_week") as string) : null,
    frequency_weeks: parseInt(formData.get("frequency_weeks") as string) || 4,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/rounds");
  redirect("/dashboard/rounds");
}

export async function updateRound(id: string, formData: FormData) {
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
    .from("rounds")
    .update({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      day_of_week: formData.get("day_of_week") ? parseInt(formData.get("day_of_week") as string) : null,
      frequency_weeks: parseInt(formData.get("frequency_weeks") as string) || 4,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/rounds");
  redirect("/dashboard/rounds");
}

export async function deleteRound(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { error } = await supabase.from("rounds").update({ deleted_at: new Date().toISOString() }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/rounds");
  redirect("/dashboard/rounds");
}

export async function reorderRoundCustomers(roundId: string, orderedCustomerIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Admin only" };

  for (let i = 0; i < orderedCustomerIds.length; i++) {
    await supabase
      .from("customers")
      .update({ position_in_round: i + 1 })
      .eq("id", orderedCustomerIds[i])
      .eq("round_id", roundId);
  }

  revalidatePath(`/dashboard/rounds/${roundId}`);
}
