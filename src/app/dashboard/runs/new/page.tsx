import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createRun } from "../actions";
import { RunCreateForm } from "../run-create-form";

interface NewRunPageProps {
  searchParams: Promise<{ round_id?: string }>;
}

export default async function NewRunPage({ searchParams }: NewRunPageProps) {
  const { round_id } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .order("name");

  const { data: cleaners } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["admin", "cleaner"])
    .order("full_name");

  // If a round template is pre-selected, get its name for default
  let defaultName = "";
  if (round_id) {
    const round = rounds?.find((r) => r.id === round_id);
    if (round) {
      const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      defaultName = `${round.name} — ${today}`;
    }
  }

  async function action(_prevState: { error?: string } | undefined, formData: FormData) {
    "use server";
    const result = await createRun(formData);
    return result;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Create Run</h2>
      <RunCreateForm
        rounds={rounds ?? []}
        cleaners={cleaners ?? []}
        defaultRoundId={round_id ?? ""}
        defaultName={defaultName}
        action={action}
      />
    </div>
  );
}
