import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RoundViewClient } from "./round-view-client";
import { Play } from "lucide-react";

interface RoundViewPageProps {
  searchParams: Promise<{ run?: string }>;
}

export default async function RoundViewPage({ searchParams }: RoundViewPageProps) {
  const { run: selectedRunId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Get all pending/in_progress runs assigned to this user
  const { data: assignments } = await supabase
    .from("run_cleaners")
    .select("run_id")
    .eq("cleaner_id", user.id);

  const runIds = assignments?.map((a) => a.run_id) ?? [];

  // Fetch available runs (assigned to user, or all if admin)
  let availableRuns: { id: string; name: string; scheduled_date: string; status: string; customer_count: number }[] = [];

  if (profile?.role === "admin") {
    const { data: runs } = await supabase
      .from("runs")
      .select("id, name, scheduled_date, status, run_customers(count)")
      .in("status", ["planned", "in_progress"])
      .order("scheduled_date", { ascending: true });

    availableRuns = (runs ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      scheduled_date: r.scheduled_date,
      status: r.status,
      customer_count: (r.run_customers as unknown as { count: number }[])?.[0]?.count ?? 0,
    }));
  } else if (runIds.length > 0) {
    const { data: runs } = await supabase
      .from("runs")
      .select("id, name, scheduled_date, status, run_customers(count)")
      .in("id", runIds)
      .in("status", ["planned", "in_progress"])
      .order("scheduled_date", { ascending: true });

    availableRuns = (runs ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      scheduled_date: r.scheduled_date,
      status: r.status,
      customer_count: (r.run_customers as unknown as { count: number }[])?.[0]?.count ?? 0,
    }));
  }

  // If a run is selected, load it
  if (selectedRunId) {
    // Verify user has access to this run
    const hasAccess = profile?.role === "admin" || runIds.includes(selectedRunId);
    if (!hasAccess) redirect("/dashboard/round-view");

    const { data: activeRun } = await supabase
      .from("runs")
      .select("*")
      .eq("id", selectedRunId)
      .single();

    if (!activeRun) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">Run Not Found</h2>
          <Link href="/dashboard/round-view" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to runs
          </Link>
        </div>
      );
    }

    const { data: customers } = await supabase
      .from("run_customers")
      .select("customer_id, position, price, status, notes, completed_at, customers(id, first_name, last_name, address_line1, address_line2, city, postcode, phone, latitude, longitude, notes)")
      .eq("run_id", activeRun.id)
      .order("position", { ascending: true });

    const { data: extras } = await supabase
      .from("run_customer_extras")
      .select("id, customer_id, description, price")
      .eq("run_id", activeRun.id);

    type RunCustomer = {
      customer_id: string;
      position: number;
      price: number;
      status: string;
      notes: string | null;
      completed_at: string | null;
      customers: {
        id: string;
        first_name: string;
        last_name: string;
        address_line1: string;
        address_line2: string | null;
        city: string;
        postcode: string;
        phone: string | null;
        latitude: number | null;
        longitude: number | null;
        notes: string | null;
      } | null;
    };

    return (
      <div>
        <div className="mb-4">
          <Link href="/dashboard/round-view" className="text-sm text-gray-500 hover:text-gray-700">
            ← All Runs
          </Link>
        </div>
        <RoundViewClient
          run={activeRun}
          customers={(customers as unknown as RunCustomer[]) ?? []}
          extras={extras ?? []}
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
        />
      </div>
    );
  }

  // No run selected — show list of available runs
  if (availableRuns.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">No Active Runs</h2>
        <p className="text-gray-500">You don&apos;t have any runs assigned.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Your Runs</h2>
      <div className="space-y-3">
        {availableRuns.map((run) => (
          <Link
            key={run.id}
            href={`/dashboard/round-view?run=${run.id}`}
            className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{run.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    run.status === "in_progress" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {run.status === "in_progress" ? "In Progress" : "Planned"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(run.scheduled_date).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  {" · "}{run.customer_count} customers
                </p>
              </div>
              <Play className="w-5 h-5 text-blue-500" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
