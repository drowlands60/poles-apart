"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { error } = await supabase.from("customers").insert({
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    address_line1: formData.get("address_line1") as string,
    address_line2: (formData.get("address_line2") as string) || null,
    city: formData.get("city") as string,
    postcode: formData.get("postcode") as string,
    price: parseFloat(formData.get("price") as string) || 0,
    notes: (formData.get("notes") as string) || null,
    round_id: (formData.get("round_id") as string) || null,
    sms_opt_in: formData.get("sms_opt_in") === "on",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function updateCustomer(id: string, formData: FormData) {
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
    .from("customers")
    .update({
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address_line1: formData.get("address_line1") as string,
      address_line2: (formData.get("address_line2") as string) || null,
      city: formData.get("city") as string,
      postcode: formData.get("postcode") as string,
      price: parseFloat(formData.get("price") as string) || 0,
      notes: (formData.get("notes") as string) || null,
      round_id: (formData.get("round_id") as string) || null,
      is_active: formData.get("is_active") === "on",
      sms_opt_in: formData.get("sms_opt_in") === "on",
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function deleteCustomer(id: string) {
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
    .from("customers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}
