import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Redirect non-admins to round view
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") redirect("/dashboard/round-view");
  }

  const { count: customerCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .is("deleted_at", null);

  const { count: roundCount } = await supabase
    .from("rounds")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  const { data: settings } = await supabase
    .from("app_settings")
    .select("target_turnover_one, target_turnover_two")
    .eq("id", 1)
    .single();

  const targetOne = settings?.target_turnover_one ?? 200;
  const targetTwo = settings?.target_turnover_two ?? 340;

  async function updateTargets(formData: FormData) {
    "use server";
    const supabase2 = (await import("@/lib/supabase/server")).createClient;
    const client = await supabase2();
    const { data: { user: u } } = await client.auth.getUser();
    if (!u) redirect("/login");
    const { data: p } = await client.from("profiles").select("role").eq("id", u.id).single();
    if (p?.role !== "admin") redirect("/dashboard");

    const one = parseFloat(formData.get("target_one") as string);
    const two = parseFloat(formData.get("target_two") as string);
    if (isNaN(one) || isNaN(two)) return;

    await client.from("app_settings").update({
      target_turnover_one: one,
      target_turnover_two: two,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/runs");
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Active Customers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{customerCount ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Rounds</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{roundCount ?? 0}</p>
        </div>
      </div>

      {/* Target Turnover Settings */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Run Target Turnover</h3>
        <p className="text-sm text-gray-500 mb-4">Minimum turnover targets used to flag runs that are below target.</p>
        <form action={updateTargets} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div>
            <label htmlFor="target_one" className="block text-sm font-medium text-gray-700 mb-1">1 Cleaner (£)</label>
            <input
              type="number"
              id="target_one"
              name="target_one"
              step="0.01"
              min="0"
              defaultValue={targetOne}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="target_two" className="block text-sm font-medium text-gray-700 mb-1">2 Cleaners (£)</label>
            <input
              type="number"
              id="target_two"
              name="target_two"
              step="0.01"
              min="0"
              defaultValue={targetTwo}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
