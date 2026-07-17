import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { updateCustomer } from "../actions";
import { CustomerForm } from "../customer-form";
import { DeleteCustomerButton } from "./delete-button";
import { AddChargeButton } from "../add-charge-button";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
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

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .order("name");

  // Get run notes history for this customer
  const { data: runNotes } = await supabase
    .from("run_customers")
    .select("notes, status, completed_at, runs(name, scheduled_date)")
    .eq("customer_id", id)
    .not("notes", "is", null)
    .order("position", { ascending: false });

  // Balance: total completed work vs payments
  const { data: completedWork } = await supabase
    .from("run_customers")
    .select("price")
    .eq("customer_id", id)
    .eq("status", "completed");

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, payment_date, method")
    .eq("customer_id", id)
    .order("payment_date", { ascending: false });

  // Ad-hoc charges
  const { data: adhocCharges } = await supabase
    .from("adhoc_charges")
    .select("amount")
    .eq("customer_id", id)
    .eq("paid", false);

  const totalOwed = (completedWork?.reduce((sum, w) => sum + Number(w.price), 0) ?? 0)
    + (adhocCharges?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0);
  const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const balance = totalOwed - totalPaid;

  async function action(_prevState: { error?: string } | undefined, formData: FormData) {
    "use server";
    const result = await updateCustomer(id, formData);
    return result;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1e3a5f]">
          Edit Customer — {customer.first_name} {customer.last_name}
        </h2>
        <DeleteCustomerButton id={customer.id} name={`${customer.first_name} ${customer.last_name}`} />
      </div>

      {/* Balance */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Balance</h3>
        <AddChargeButton customerId={customer.id} />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-medium">Work Done</p>
          <p className="text-lg font-bold text-gray-900">£{totalOwed.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-medium">Paid</p>
          <p className="text-lg font-bold text-green-700">£{totalPaid.toFixed(2)}</p>
        </div>
        <div className={`p-4 rounded-lg border ${balance > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <p className="text-xs text-gray-500 uppercase font-medium">Balance</p>
          <p className={`text-lg font-bold ${balance > 0 ? "text-red-700" : "text-green-700"}`}>
            {balance > 0 ? `£${balance.toFixed(2)} owed` : balance < 0 ? `£${Math.abs(balance).toFixed(2)} credit` : "Settled"}
          </p>
        </div>
      </div>

      <CustomerForm
        customer={customer}
        rounds={rounds ?? []}
        action={action}
        submitLabel="Save Changes"
      />

      {/* Run notes history */}
      {runNotes && runNotes.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Run Notes</h3>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {runNotes.map((rn, i) => {
              const run = rn.runs as unknown as { name: string; scheduled_date: string } | null;
              return (
                <div key={i} className="p-3 flex items-start gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${
                    rn.status === "completed" ? "bg-green-100 text-green-700" :
                    rn.status === "skipped" ? "bg-gray-100 text-gray-600" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {rn.status}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">{rn.notes}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {run?.name} — {run?.scheduled_date ? new Date(run.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
