import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Customer } from "@/lib/types";
import { CustomerTable } from "./customer-table";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: customers } = await supabase
    .from("customers")
    .select("*, rounds(name)")
    .is("deleted_at", null)
    .order("last_name", { ascending: true }) as { data: (Customer & { rounds: { name: string } | null })[] | null };

  // Get outstanding balances per customer
  const { data: unpaidItems } = await supabase
    .from("run_customers")
    .select("customer_id, price")
    .eq("status", "completed")
    .eq("paid", false);

  const { data: unpaidAdhoc } = await supabase
    .from("adhoc_charges")
    .select("customer_id, amount")
    .eq("paid", false);

  const balanceMap: Record<string, number> = {};
  if (unpaidItems) {
    for (const item of unpaidItems) {
      balanceMap[item.customer_id] = (balanceMap[item.customer_id] ?? 0) + Number(item.price);
    }
  }
  if (unpaidAdhoc) {
    for (const item of unpaidAdhoc) {
      balanceMap[item.customer_id] = (balanceMap[item.customer_id] ?? 0) + Number(item.amount);
    }
  }

  // Get unique round names for filter
  const roundNames = [...new Set((customers ?? []).map((c) => c.rounds?.name).filter(Boolean))] as string[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1e3a5f]">Customers</h2>
        <Link
          href="/dashboard/customers/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Link>
      </div>

      {!customers || customers.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No customers yet.</p>
          <Link
            href="/dashboard/customers/new"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
          >
            Add your first customer
          </Link>
        </div>
      ) : (
        <CustomerTable customers={customers} roundNames={roundNames} balanceMap={balanceMap} />
      )}
    </div>
  );
}
