import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CleanersList } from "./cleaners-list";

export default async function CleanersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: cleaners } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .eq("role", "cleaner")
    .order("full_name");

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Cleaners</h2>
      <CleanersList cleaners={cleaners ?? []} currentUserId={user.id} />
    </div>
  );
}
