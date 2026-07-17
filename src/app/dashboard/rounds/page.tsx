import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function RoundsPage() {
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
    .select("*, customers(count)")
    .order("name");

  // Get last completed run date for each round
  const today = new Date().toISOString().split("T")[0];
  const { data: lastRuns } = await supabase
    .from("runs")
    .select("round_id, scheduled_date")
    .not("round_id", "is", null)
    .eq("status", "completed")
    .lte("scheduled_date", today)
    .order("scheduled_date", { ascending: false });

  // Build a map of round_id -> last scheduled_date
  const lastRunMap: Record<string, string> = {};
  if (lastRuns) {
    for (const run of lastRuns) {
      if (run.round_id && !lastRunMap[run.round_id]) {
        lastRunMap[run.round_id] = run.scheduled_date;
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1e3a5f]">Round Templates</h2>
        <Link
          href="/dashboard/rounds/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Round
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Round templates define recurring groups of customers. Create a <strong>run</strong> from a template to schedule actual work.
      </p>

      {!rounds || rounds.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No round templates yet.</p>
          <Link
            href="/dashboard/rounds/new"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
          >
            Create your first round
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rounds.map((round) => (
            <div key={round.id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{round.name}</h3>
                  {round.description && (
                    <p className="text-sm text-gray-500 mt-1">{round.description}</p>
                  )}
                </div>
                <Link
                  href={`/dashboard/rounds/${round.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Edit
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span>Every {round.frequency_weeks} weeks</span>
                <span>{round.customers?.[0]?.count ?? 0} customers</span>
              </div>
              {lastRunMap[round.id] && (
                <div className="mt-2 text-xs text-gray-500">
                  Last run: {new Date(lastRunMap[round.id]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              )}
              {!lastRunMap[round.id] && (
                <div className="mt-2 text-xs text-gray-400 italic">Never run</div>
              )}
              <div className="mt-3">
                <Link
                  href={`/dashboard/runs/new?round_id=${round.id}`}
                  className="text-sm font-medium text-green-600 hover:text-green-700"
                >
                  Create Run →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link to runs */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Live Runs</h3>
            <p className="text-sm text-gray-500">Scheduled instances of round templates</p>
          </div>
          <Link
            href="/dashboard/runs"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All Runs →
          </Link>
        </div>
      </div>
    </div>
  );
}
