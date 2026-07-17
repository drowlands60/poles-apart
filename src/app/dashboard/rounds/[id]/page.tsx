import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { updateRound } from "../actions";
import { RoundForm } from "../round-form";
import { DeleteRoundButton } from "./delete-button";

interface EditRoundPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRoundPage({ params }: EditRoundPageProps) {
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

  const { data: round } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", id)
    .single();

  if (!round) notFound();

  // Get customers assigned to this template
  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, address_line1, postcode, price, position_in_round")
    .eq("round_id", id)
    .eq("is_active", true)
    .order("position_in_round", { ascending: true });

  async function action(_prevState: { error?: string } | undefined, formData: FormData) {
    "use server";
    const result = await updateRound(id, formData);
    return result;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Round — {round.name}</h2>
        <DeleteRoundButton id={round.id} name={round.name} />
      </div>

      <RoundForm round={round} action={action} submitLabel="Save Changes" />

      {/* Show customers in this template */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Customers in this template ({customers?.length ?? 0})
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Assign customers to this round from the{" "}
          <a href="/dashboard/customers" className="text-blue-600 hover:text-blue-700">customers page</a>.
          When you create a run, these customers will be copied in.
        </p>
        {customers && customers.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">{c.position_in_round ?? i + 1}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{c.first_name} {c.last_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{c.address_line1}, {c.postcode}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">£{Number(c.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-700 text-right">Total</td>
                  <td className="px-4 py-2 text-sm font-bold text-gray-900">
                    £{customers.reduce((sum, c) => sum + Number(c.price), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No customers assigned to this template yet.</p>
        )}
      </div>
    </div>
  );
}
