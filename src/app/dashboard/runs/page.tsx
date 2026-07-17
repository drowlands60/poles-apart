import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";

const TARGET_TURNOVER_TWO = 340;
const TARGET_TURNOVER_ONE = 200;

export default async function RunsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: runs } = await supabase
    .from("runs")
    .select("*, run_cleaners(cleaner_id, profiles(full_name)), run_customers(price)")
    .order("scheduled_date", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Runs</h2>
        <Link
          href="/dashboard/runs/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Run
        </Link>
      </div>

      {!runs || runs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No runs created yet.</p>
          <Link
            href="/dashboard/runs/new"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
          >
            Create your first run
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const turnover = run.run_customers?.reduce(
              (sum: number, rc: { price: number }) => sum + Number(rc.price),
              0
            ) ?? 0;
            const cleanerCount = run.run_cleaners?.length ?? 0;
            const target = cleanerCount >= 2 ? TARGET_TURNOVER_TWO : TARGET_TURNOVER_ONE;
            const belowTarget = cleanerCount > 0 && turnover < target;

            return (
              <Link
                key={run.id}
                href={`/dashboard/runs/${run.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{run.name}</h3>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          run.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : run.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {run.status === "in_progress" ? "In Progress" : run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(run.scheduled_date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {cleanerCount > 0 && (
                        <> · {run.run_cleaners.map((rc: { profiles: { full_name: string }[] }) => rc.profiles[0]?.full_name).join(", ")}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {belowTarget && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={`text-lg font-bold ${belowTarget ? "text-amber-600" : "text-gray-900"}`}>
                        £{turnover.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {run.run_customers?.length ?? 0} customers · target £{cleanerCount > 0 ? target : "—"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
