import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { updateCustomer, deleteCustomer } from "../actions";
import { CustomerForm } from "../customer-form";
import { DeleteCustomerButton } from "./delete-button";

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

  async function action(_prevState: { error?: string } | undefined, formData: FormData) {
    "use server";
    const result = await updateCustomer(id, formData);
    return result;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Edit Customer — {customer.first_name} {customer.last_name}
        </h2>
        <DeleteCustomerButton id={customer.id} name={`${customer.first_name} ${customer.last_name}`} />
      </div>
      <CustomerForm
        customer={customer}
        rounds={rounds ?? []}
        action={action}
        submitLabel="Save Changes"
      />
    </div>
  );
}
