import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createRound } from "../actions";
import { RoundForm } from "../round-form";

export default async function NewRoundPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  async function action(_prevState: { error?: string } | undefined, formData: FormData) {
    "use server";
    const result = await createRound(formData);
    return result;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">New Round Template</h2>
      <RoundForm action={action} submitLabel="Create Round" />
    </div>
  );
}
