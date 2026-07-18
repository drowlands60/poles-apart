import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { updateRun, deleteRun } from "../actions";
import { AlertTriangle, Trash2 } from "lucide-react";
import { RunDetailClient } from "./run-detail-client";
import { RunMap } from "./run-map";
import { SmsButtons } from "./sms-buttons";

interface RunDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: run } = await supabase
    .from("runs")
    .select("*")
    .eq("id", id)
    .single();

  if (!run) notFound();

  const { data: runCleaners } = await supabase
    .from("run_cleaners")
    .select("cleaner_id, profiles(id, full_name)")
    .eq("run_id", id);

  const { data: runCustomers } = await supabase
    .from("run_customers")
    .select("*, customers(id, first_name, last_name, address_line1, postcode, phone, latitude, longitude)")
    .eq("run_id", id)
    .order("position", { ascending: true });

  // All cleaners for assignment
  const { data: allCleaners } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["admin", "cleaner"])
    .order("full_name");

  // All active customers not already in this run (for add dropdown)
  const existingCustomerIds = runCustomers?.map((rc) => rc.customer_id) ?? [];
  const { data: availableCustomers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, address_line1, postcode, price")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("last_name");

  // All rounds (for adding a whole round)
  const { data: allRounds } = await supabase
    .from("rounds")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  const filteredAvailable = availableCustomers?.filter(
    (c) => !existingCustomerIds.includes(c.id)
  ) ?? [];

  // Extras (additional jobs per customer)
  const { data: extras } = await supabase
    .from("run_customer_extras")
    .select("id, customer_id, description, price")
    .eq("run_id", id);

  // Turnover calculation
  const { data: settings } = await supabase
    .from("app_settings")
    .select("target_turnover_one, target_turnover_two")
    .eq("id", 1)
    .single();

  const extrasTurnover = extras?.reduce((sum, e) => sum + Number(e.price), 0) ?? 0;
  const turnover = (runCustomers?.reduce((sum, rc) => sum + Number(rc.price), 0) ?? 0) + extrasTurnover;
  const cleanerCount = runCleaners?.length ?? 0;
  const targetOne = settings?.target_turnover_one ?? 200;
  const targetTwo = settings?.target_turnover_two ?? 340;
  const target = cleanerCount >= 2 ? targetTwo : targetOne;
  const belowTarget = cleanerCount > 0 && turnover < target;

  // Customer SMS data for the SMS panel
  const smsCustomers = runCustomers?.map((rc) => {
    const c = rc.customers as unknown as { id: string; first_name: string; last_name: string; phone: string | null } | null;
    return {
      customer_id: rc.customer_id,
      first_name: c?.first_name ?? "",
      last_name: c?.last_name ?? "",
      phone: c?.phone ?? null,
      sms_opt_in: true,
      sms_day_before_sent: rc.sms_day_before_sent ?? false,
      sms_completed_sent: rc.sms_completed_sent ?? false,
    };
  }) ?? [];

  // Get sms_opt_in for all customers in this run
  if (smsCustomers.length > 0) {
    const { data: optIns } = await supabase
      .from("customers")
      .select("id, sms_opt_in")
      .in("id", smsCustomers.map((c) => c.customer_id));
    if (optIns) {
      const optInMap = new Map(optIns.map((o) => [o.id, o.sms_opt_in]));
      for (const c of smsCustomers) {
        c.sms_opt_in = optInMap.get(c.customer_id) ?? true;
      }
    }
  }

  async function handleUpdate(_prevState: { error?: string } | undefined, formData: FormData) {
    "use server";
    const result = await updateRun(id, formData);
    return result;
  }

  async function handleDelete() {
    "use server";
    await deleteRun(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1e3a5f]">{run.name}</h2>
          <p className="text-sm text-gray-500">
            {new Date(run.scheduled_date).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <form action={handleDelete}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Delete Run
          </button>
        </form>
      </div>

      {/* Turnover Alert */}
      {belowTarget && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Below target turnover</p>
            <p className="text-sm text-amber-700">
              Current: £{turnover.toFixed(2)} · Target: £{target.toFixed(2)} ({cleanerCount} cleaner{cleanerCount > 1 ? "s" : ""})
              · Shortfall: £{(target - turnover).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Turnover Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-medium">Turnover</p>
          <p className={`text-2xl font-bold ${belowTarget ? "text-amber-600" : "text-gray-900"}`}>
            £{turnover.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-medium">Customers</p>
          <p className="text-2xl font-bold text-[#1e3a5f]">{runCustomers?.length ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-medium">Cleaners</p>
          <p className="text-2xl font-bold text-[#1e3a5f]">
            {runCleaners?.map((rc) => (rc.profiles as unknown as { full_name: string } | null)?.full_name).join(", ") || "None assigned"}
          </p>
        </div>
      </div>

      {/* SMS Notifications */}
      <SmsButtons runId={id} runStatus={run.status} customers={smsCustomers} />

      {/* Client-side interactive section */}
      <RunDetailClient
        runId={id}
        run={run}
        runCleaners={runCleaners ?? []}
        runCustomers={(runCustomers as unknown as React.ComponentProps<typeof RunDetailClient>["runCustomers"]) ?? []}
        allCleaners={allCleaners ?? []}
        availableCustomers={filteredAvailable}
        allRounds={allRounds ?? []}
        extras={extras ?? []}
        updateAction={handleUpdate}
      />

      {/* Map of customer locations */}
      <div className="mt-6">
        <RunMap
          customers={(runCustomers ?? []).map((rc, i) => {
            const c = rc.customers as unknown as { first_name: string; last_name: string; address_line1: string; postcode: string; latitude: number | null; longitude: number | null } | null;
            return {
              customer_id: rc.customer_id,
              name: `${c?.first_name ?? ""} ${c?.last_name ?? ""}`.trim(),
              address: c?.address_line1 ?? "",
              postcode: c?.postcode ?? "",
              position: i + 1,
              latitude: c?.latitude ?? null,
              longitude: c?.longitude ?? null,
            };
          })}
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
        />
      </div>
    </div>
  );
}
