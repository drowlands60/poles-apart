import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PaymentsClient } from "./payments-client";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Payments due: completed, not paid
  const { data: due } = await supabase
    .from("run_customers")
    .select("run_id, customer_id, price, runs(name, scheduled_date), customers(first_name, last_name, address_line1)")
    .eq("status", "completed")
    .eq("paid", false)
    .order("customer_id");

  // Ad-hoc charges due
  const { data: adhocDue } = await supabase
    .from("adhoc_charges")
    .select("id, customer_id, amount, notes, created_at, customers(first_name, last_name, address_line1)")
    .eq("paid", false);

  // Payments received: completed, paid this month
  const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  const { data: received } = await supabase
    .from("run_customers")
    .select("run_id, customer_id, price, paid_at, runs(name, scheduled_date), customers(first_name, last_name, address_line1)")
    .eq("status", "completed")
    .eq("paid", true)
    .gte("paid_at", monthStart)
    .order("paid_at", { ascending: false });

  // Ad-hoc charges received this month
  const { data: adhocReceived } = await supabase
    .from("adhoc_charges")
    .select("id, customer_id, amount, notes, paid_at, customers(first_name, last_name, address_line1)")
    .eq("paid", true)
    .gte("paid_at", monthStart);

  type PaymentItem = {
    run_id: string;
    customer_id: string;
    price: number;
    paid_at?: string | null;
    runs: { name: string; scheduled_date: string } | null;
    customers: { first_name: string; last_name: string; address_line1: string } | null;
    adhoc_id?: string;
    notes?: string | null;
  };

  // Merge adhoc into due/received as PaymentItems
  const allDue: PaymentItem[] = [
    ...((due as unknown as PaymentItem[]) ?? []),
    ...((adhocDue ?? []).map((a) => ({
      run_id: "",
      customer_id: a.customer_id,
      price: Number(a.amount),
      runs: { name: "Ad-hoc charge", scheduled_date: a.created_at.split("T")[0] },
      customers: a.customers as unknown as { first_name: string; last_name: string; address_line1: string } | null,
      adhoc_id: a.id,
      notes: a.notes,
    }))),
  ];

  const allReceived: PaymentItem[] = [
    ...((received as unknown as PaymentItem[]) ?? []),
    ...((adhocReceived ?? []).map((a) => ({
      run_id: "",
      customer_id: a.customer_id,
      price: Number(a.amount),
      paid_at: a.paid_at,
      runs: { name: "Ad-hoc charge", scheduled_date: "" },
      customers: a.customers as unknown as { first_name: string; last_name: string; address_line1: string } | null,
      adhoc_id: a.id,
      notes: a.notes,
    }))),
  ];

  const totalDue = allDue.reduce((sum, d) => sum + Number(d.price), 0);
  const totalReceived = allReceived.reduce((sum, r) => sum + Number(r.price), 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Payments</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-xs text-red-600 uppercase font-medium">Outstanding</p>
          <p className="text-2xl font-bold text-red-700">£{totalDue.toFixed(2)}</p>
          <p className="text-xs text-red-500">{due?.length ?? 0} items</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-xs text-green-600 uppercase font-medium">Received This Month</p>
          <p className="text-2xl font-bold text-green-700">£{totalReceived.toFixed(2)}</p>
          <p className="text-xs text-green-500">{received?.length ?? 0} items</p>
        </div>
      </div>

      <PaymentsClient
        due={allDue}
        received={allReceived}
      />
    </div>
  );
}
