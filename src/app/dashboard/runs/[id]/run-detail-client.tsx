"use client";

import { useActionState, useTransition } from "react";
import { addCustomerToRun, removeCustomerFromRun } from "../actions";
import { X, Plus, UserPlus } from "lucide-react";
import { useState } from "react";

interface RunDetailClientProps {
  runId: string;
  run: { name: string; scheduled_date: string; status: string };
  runCleaners: { cleaner_id: string; profiles: { id: string; full_name: string }[] }[];
  runCustomers: {
    customer_id: string;
    position: number;
    price: number;
    status: string;
    customers: { id: string; first_name: string; last_name: string; address_line1: string; postcode: string; phone: string | null }[] | null;
  }[];
  allCleaners: { id: string; full_name: string }[];
  availableCustomers: { id: string; first_name: string; last_name: string; address_line1: string; postcode: string; price: number }[];
  updateAction: (prevState: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string } | undefined>;
}

export function RunDetailClient({
  runId,
  run,
  runCleaners,
  runCustomers,
  allCleaners,
  availableCustomers,
  updateAction,
}: RunDetailClientProps) {
  const [state, formAction, pending] = useActionState(updateAction, undefined);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [removePending, startRemoveTransition] = useTransition();
  const [addPending, startAddTransition] = useTransition();

  function handleRemoveCustomer(customerId: string) {
    startRemoveTransition(() => {
      removeCustomerFromRun(runId, customerId);
    });
  }

  function handleAddCustomer(customerId: string, price: number) {
    startAddTransition(() => {
      addCustomerToRun(runId, customerId, price);
    });
    setShowAddCustomer(false);
  }

  return (
    <div className="space-y-6">
      {/* Edit Run Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Run Settings</h3>
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {state.error}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={run.name}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                id="scheduled_date"
                name="scheduled_date"
                required
                defaultValue={run.scheduled_date}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status"
                name="status"
                defaultValue={run.status}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cleaners</label>
            <div className="flex flex-wrap gap-3">
              {allCleaners.map((cleaner) => (
                <label key={cleaner.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="cleaner_ids"
                    value={cleaner.id}
                    defaultChecked={runCleaners.some((rc) => rc.cleaner_id === cleaner.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{cleaner.full_name}</span>
                </label>
              ))}
              {allCleaners.length === 0 && (
                <p className="text-sm text-gray-500 italic">No cleaner profiles found.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* Customers in Run */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Customers ({runCustomers.length})
          </h3>
          <button
            onClick={() => setShowAddCustomer(!showAddCustomer)}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        {/* Add Customer Dropdown */}
        {showAddCustomer && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {availableCustomers.length === 0 ? (
              <p className="text-sm text-gray-500">All active customers are already in this run.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {availableCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleAddCustomer(c.id, c.price)}
                    disabled={addPending}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded flex items-center justify-between disabled:opacity-50"
                  >
                    <span>
                      <span className="font-medium">{c.first_name} {c.last_name}</span>
                      <span className="text-gray-500 ml-2">{c.address_line1}, {c.postcode}</span>
                    </span>
                    <span className="text-gray-700 font-medium">£{Number(c.price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Customer List */}
        {runCustomers.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No customers in this run yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {runCustomers.map((rc, i) => {
              const cust = rc.customers?.[0];
              return (
              <div key={rc.customer_id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-400 w-5 text-center">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {cust?.first_name} {cust?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cust?.address_line1}, {cust?.postcode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">£{Number(rc.price).toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    rc.status === "completed" ? "bg-green-100 text-green-700" :
                    rc.status === "skipped" ? "bg-gray-100 text-gray-600" :
                    rc.status === "cancelled" ? "bg-red-100 text-red-600" :
                    "bg-blue-50 text-blue-700"
                  }`}>
                    {rc.status}
                  </span>
                  <button
                    onClick={() => handleRemoveCustomer(rc.customer_id)}
                    disabled={removePending}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                    title="Remove from run"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
