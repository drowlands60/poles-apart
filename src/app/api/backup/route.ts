import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// API route for exporting critical data as JSON backup
// Can be called by a cron service (e.g. cron-job.org) or manually
// Secured with a secret token in the query string

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Verify backup token
  const expectedToken = process.env.BACKUP_SECRET_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Export critical tables
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .is("deleted_at", null);

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .is("deleted_at", null);

  const { data: runs } = await supabase
    .from("runs")
    .select("*")
    .is("deleted_at", null);

  const { data: runCustomers } = await supabase
    .from("run_customers")
    .select("*");

  const { data: payments } = await supabase
    .from("payments")
    .select("*");

  const { data: adhocCharges } = await supabase
    .from("adhoc_charges")
    .select("*");

  const backup = {
    exported_at: new Date().toISOString(),
    customers,
    rounds,
    runs,
    run_customers: runCustomers,
    payments,
    adhoc_charges: adhocCharges,
  };

  return NextResponse.json(backup, {
    headers: {
      "Content-Disposition": `attachment; filename="poles-apart-backup-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
