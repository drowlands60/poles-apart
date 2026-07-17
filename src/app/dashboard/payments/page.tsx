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

  // Payments received: completed, paid this month
  const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  const { data: received } = await supabase
    .from("run_customers")
    .select("run_id, customer_id, price, paid_at, runs(name, scheduled_date), customers(first_name, last_name, address_line1)")
    .eq("status", "completed")
    .eq("paid", true)
    .gte("paid_at", monthStart)
    .order("paid_at", { ascending: false });

  type PaymentItem = {
    run_id: string;
    customer_id: string;
    price: number;
    paid_at?: string | null;
    runs: { name: string; scheduled_date: string } | null;
    customers: { first_name: string; last_name: string; address_line1: string } | null;
  };

  const totalDue = due?.reduce((sum, d) => sum + Number(d.price), 0) ?? 0;
  const totalReceived = received?.reduce((sum, r) => sum + Number(r.price), 0) ?? 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payments</h2>

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
        due={(due as unknown as PaymentItem[]) ?? []}
        received={(received as unknown as PaymentItem[]) ?? []}
      />
    </div>
  );
}
