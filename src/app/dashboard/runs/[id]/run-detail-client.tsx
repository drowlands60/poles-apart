"use client";

import { useActionState, useTransition } from "react";
import { addCustomerToRun, removeCustomerFromRun, addNewCustomerToRun, addRoundToRun } from "../actions";
import { X, UserPlus, Search, Plus } from "lucide-react";
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
    customers: { id: string; first_name: string; last_name: string; address_line1: string; postcode: string; phone: string | null } | null;
  }[];
  allCleaners: { id: string; full_name: string }[];
  availableCustomers: { id: string; first_name: string; last_name: string; address_line1: string; postcode: string; price: number }[];
  allRounds: { id: string; name: string }[];
  updateAction: (prevState: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string } | undefined>;
}

export function RunDetailClient({
  runId,
  run,
  runCleaners,
  runCustomers,
  allCleaners,
  availableCustomers,
  allRounds,
  updateAction,
}: RunDetailClientProps) {
  const [state, formAction, pending] = useActionState(updateAction, undefined);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddRound, setShowAddRound] = useState(false);
  const [roundPending, startRoundTransition] = useTransition();
  const [roundResult, setRoundResult] = useState<string | null>(null);
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
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider shrink-0">
            Customers ({runCustomers.length})
          </h3>
          {run.status !== "completed" && (
            <div className="flex items-center gap-3">
              {allRounds.length > 0 && (
                <button
                  onClick={() => { setShowAddRound(!showAddRound); setShowAddCustomer(false); }}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  Add Round
                </button>
              )}
              <button
                onClick={() => { setShowAddCustomer(!showAddCustomer); setShowAddRound(false); }}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                Add Customer
              </button>
            </div>
          )}
        </div>
        {roundResult && (
          <p className={`text-xs mb-3 ${roundResult.startsWith("Added") ? "text-green-600" : "text-red-600"}`}>
            {roundResult}
          </p>
        )}

        {/* Add Round Panel */}
        {showAddRound && (
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-900 mb-2">Add all customers from a round:</p>
            <div className="space-y-1">
              {allRounds.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    startRoundTransition(async () => {
                      const res = await addRoundToRun(runId, r.id);
                      if (res && "error" in res) setRoundResult(res.error ?? null);
                      else if (res && "added" in res) setRoundResult(`Added ${res.added} customers from ${r.name}`);
                      setShowAddRound(false);
                    });
                  }}
                  disabled={roundPending}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 font-medium hover:bg-blue-50 rounded disabled:opacity-50"
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add Customer Dropdown */}
        {showAddCustomer && (
          <AddCustomerPanel
            runId={runId}
            availableCustomers={availableCustomers}
            onAdd={handleAddCustomer}
            addPending={addPending}
            onClose={() => setShowAddCustomer(false)}
          />
        )}

        {/* Customer List */}
        {runCustomers.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No customers in this run yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {runCustomers.map((rc, i) => {
              const cust = rc.customers;
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

// --- Add Customer Panel with search + create new ---
function AddCustomerPanel({
  runId,
  availableCustomers,
  onAdd,
  addPending,
  onClose,
}: {
  runId: string;
  availableCustomers: { id: string; first_name: string; last_name: string; address_line1: string; postcode: string; price: number }[];
  onAdd: (customerId: string, price: number) => void;
  addPending: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPending, startNewTransition] = useTransition();

  const filtered = search
    ? availableCustomers.filter((c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        c.address_line1.toLowerCase().includes(search.toLowerCase())
      )
    : availableCustomers;

  function handleNewCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startNewTransition(async () => {
      await addNewCustomerToRun(runId, formData);
      onClose();
    });
  }

  return (
    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
      {!showNewForm ? (
        <>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center gap-1 text-xs font-medium bg-[#3b6d8f] text-white px-3 py-1.5 rounded hover:bg-[#2a5070] whitespace-nowrap"
            >
              <Plus className="w-3 h-3" />
              New
            </button>
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">
              {search ? "No customers match." : "All active customers are already in this run."}
            </p>
          ) : (
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {filtered.slice(0, 20).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onAdd(c.id, c.price)}
                  disabled={addPending}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded flex items-center justify-between disabled:opacity-50"
                >
                  <span>
                    <span className="font-medium text-gray-900">{c.first_name} {c.last_name}</span>
                    <span className="text-gray-600 ml-2">{c.address_line1}, {c.postcode}</span>
                  </span>
                  <span className="text-gray-900 font-medium">£{Number(c.price).toFixed(2)}</span>
                </button>
              ))}
              {filtered.length > 20 && (
                <p className="text-xs text-gray-400 px-3 py-1">Showing first 20 — refine your search</p>
              )}
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleNewCustomer} className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Add New Customer to Run</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="first_name" required placeholder="First name *" className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <input name="last_name" required placeholder="Last name *" className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <input name="address_line1" required placeholder="Address line 1 *" className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-2">
            <input name="city" required placeholder="City *" className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <input name="postcode" required placeholder="Postcode *" className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="phone" placeholder="Phone" className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <input name="price" type="number" step="0.01" min="0" required placeholder="Price (£) *" className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={newPending}
              className="text-sm font-medium bg-[#3b6d8f] text-white px-4 py-1.5 rounded hover:bg-[#2a5070] disabled:opacity-50"
            >
              {newPending ? "Adding..." : "Add to Run"}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
