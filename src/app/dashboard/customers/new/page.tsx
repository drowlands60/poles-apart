import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createCustomer } from "../actions";
import { CustomerForm } from "../customer-form";

export default async function NewCustomerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .order("name");

  async function action(_prevState: { error?: string } | undefined, formData: FormData) {
    "use server";
    const result = await createCustomer(formData);
    return result;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Add Customer</h2>
      <CustomerForm rounds={rounds ?? []} action={action} submitLabel="Add Customer" />
    </div>
  );
}
