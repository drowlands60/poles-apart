import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RoundViewClient } from "./round-view-client";

export default async function RoundViewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find runs assigned to this cleaner for today
  const today = new Date().toISOString().split("T")[0];

  // Get run IDs where this user is assigned as cleaner
  const { data: assignments } = await supabase
    .from("run_cleaners")
    .select("run_id")
    .eq("cleaner_id", user.id);

  const runIds = assignments?.map((a) => a.run_id) ?? [];

  let activeRun = null;
  let runCustomers: {
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
  }[] = [];

  if (runIds.length > 0) {
    // Find today's run (or most recent planned/in_progress run)
    const { data: runs } = await supabase
      .from("runs")
      .select("*")
      .in("id", runIds)
      .in("status", ["planned", "in_progress"])
      .lte("scheduled_date", today)
      .order("scheduled_date", { ascending: false })
      .limit(1);

    if (runs && runs.length > 0) {
      activeRun = runs[0];

      // Get customers for this run with their details
      const { data: customers } = await supabase
        .from("run_customers")
        .select("customer_id, position, price, status, notes, completed_at, customers(id, first_name, last_name, address_line1, address_line2, city, postcode, phone, latitude, longitude, notes)")
        .eq("run_id", activeRun.id)
        .order("position", { ascending: true });

      runCustomers = (customers as unknown as typeof runCustomers) ?? [];
    }
  }

  // Also check if user is admin — admins can view any run
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // If no assigned run found and user is admin, show the most recent planned run
  if (!activeRun && profile?.role === "admin") {
    const { data: runs } = await supabase
      .from("runs")
      .select("*")
      .in("status", ["planned", "in_progress"])
      .order("scheduled_date", { ascending: false })
      .limit(1);

    if (runs && runs.length > 0) {
      activeRun = runs[0];

      const { data: customers } = await supabase
        .from("run_customers")
        .select("customer_id, position, price, status, notes, completed_at, customers(id, first_name, last_name, address_line1, address_line2, city, postcode, phone, latitude, longitude, notes)")
        .eq("run_id", activeRun.id)
        .order("position", { ascending: true });

      runCustomers = (customers as unknown as typeof runCustomers) ?? [];
    }
  }

  if (!activeRun) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Run</h2>
        <p className="text-gray-500">You don&apos;t have any runs assigned for today.</p>
      </div>
    );
  }

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <RoundViewClient
      run={activeRun}
      customers={runCustomers}
      googleMapsApiKey={googleMapsApiKey}
    />
  );
}
