"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createCleaner(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const phone = (formData.get("phone") as string) || null;

  if (!email || !password || !fullName) {
    return { error: "Email, password, and name are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const adminSupabase = createAdminClient();

  // Create auth user
  const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, must_change_password: true },
  });

  if (authError || !newUser.user) {
    return { error: authError?.message ?? "Failed to create user" };
  }

  // Update profile to cleaner role
  await adminSupabase
    .from("profiles")
    .update({ role: "cleaner", full_name: fullName, phone })
    .eq("id", newUser.user.id);

  revalidatePath("/dashboard/cleaners");
  redirect("/dashboard/cleaners");
}

export async function deleteCleaner(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Don't allow deleting yourself
  if (id === user.id) {
    return { error: "Cannot delete your own account" };
  }

  const adminSupabase = createAdminClient();

  // Remove from any run assignments
  await adminSupabase.from("run_cleaners").delete().eq("cleaner_id", id);

  // Delete the auth user (cascades to profile via FK)
  const { error } = await adminSupabase.auth.admin.deleteUser(id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/cleaners");
}
