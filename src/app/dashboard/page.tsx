import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  const today = new Date().toISOString().split("T")[0];
  const { count: todayJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("scheduled_date", today)
    .eq("status", "scheduled");

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Active Customers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{customerCount ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Rounds</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{roundCount ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Jobs Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{todayJobs ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
