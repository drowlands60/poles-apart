"use client";

import { useState, useTransition } from "react";
import { Check, Undo2, Search } from "lucide-react";
import { markAsPaid, markAsUnpaid, markAllPaidForCustomer, markAdhocPaid, markAdhocUnpaid } from "./actions";

interface PaymentItem {
  run_id: string;
  customer_id: string;
  price: number;
  paid_at?: string | null;
  runs: { name: string; scheduled_date: string } | null;
  customers: { first_name: string; last_name: string; address_line1: string } | null;
  adhoc_id?: string;
  notes?: string | null;
}

export function PaymentsClient({ due, received }: { due: PaymentItem[]; received: PaymentItem[] }) {
  const [tab, setTab] = useState<"due" | "received">("due");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  // Group due items by customer
  const filteredDue = search
    ? due.filter((d) => `${d.customers?.first_name} ${d.customers?.last_name} ${d.customers?.address_line1}`.toLowerCase().includes(search.toLowerCase()))
    : due;

  const groupedDue = filteredDue.reduce<Record<string, { customer: { first_name: string; last_name: string; address_line1: string }; items: PaymentItem[]; total: number }>>((acc, item) => {
    const key = item.customer_id;
    if (!acc[key]) {
      acc[key] = { customer: item.customers ?? { first_name: "?", last_name: "?", address_line1: "" }, items: [], total: 0 };
    }
    acc[key].items.push(item);
    acc[key].total += Number(item.price);
    return acc;
  }, {});

  function handlePaid(item: PaymentItem) {
    startTransition(() => {
      if (item.adhoc_id) {
        markAdhocPaid(item.adhoc_id);
      } else {
        markAsPaid(item.run_id, item.customer_id);
      }
    });
  }

  function handleUnpaid(item: PaymentItem) {
    startTransition(() => {
      if (item.adhoc_id) {
        markAdhocUnpaid(item.adhoc_id);
      } else {
        markAsUnpaid(item.run_id, item.customer_id);
      }
    });
  }

  function handlePayAll(customerId: string) {
    startTransition(() => { markAllPaidForCustomer(customerId); });
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setTab("due")}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${tab === "due" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
        >
          Due ({due.length})
        </button>
        <button
          onClick={() => setTab("received")}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${tab === "received" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
        >
          Received ({received.length})
        </button>
      </div>

      {/* Due tab */}
      {tab === "due" && (
        <div className="space-y-4">
          {Object.keys(groupedDue).length === 0 && (
            <p className="text-center text-gray-500 py-8">No payments outstanding.</p>
          )}
          {Object.entries(groupedDue).map(([customerId, group]) => (
            <div key={customerId} className="bg-white rounded-lg border border-gray-200">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {group.customer.first_name} {group.customer.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{group.customer.address_line1} · {group.items.length} clean{group.items.length > 1 ? "s" : ""} unpaid</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-700">£{group.total.toFixed(2)}</span>
                  <button
                    onClick={() => handlePayAll(customerId)}
                    disabled={pending}
                    className="text-xs font-medium bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    All Paid
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {group.items.map((item) => (
                  <div key={`${item.run_id}-${item.customer_id}`} className="px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">
                        {item.runs?.name} — {item.runs?.scheduled_date ? new Date(item.runs.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">£{Number(item.price).toFixed(2)}</span>
                      <button
                        onClick={() => handlePaid(item)}
                        disabled={pending}
                        className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                        title="Mark paid"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Received tab */}
      {tab === "received" && (() => {
        const filteredReceived = search
          ? received.filter((r) => `${r.customers?.first_name} ${r.customers?.last_name} ${r.customers?.address_line1}`.toLowerCase().includes(search.toLowerCase()))
          : received;
        return (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {filteredReceived.length === 0 && (
            <p className="text-center text-gray-500 py-8">No payments received yet.</p>
          )}
          {filteredReceived.map((item) => (
            <div key={`${item.run_id}-${item.customer_id}`} className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.customers?.first_name} {item.customers?.last_name}
                  <span className="text-gray-500 font-normal ml-2">{item.customers?.address_line1}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {item.runs?.name} — {item.runs?.scheduled_date ? new Date(item.runs.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                  {item.paid_at && ` · Paid ${new Date(item.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-700">£{Number(item.price).toFixed(2)}</span>
                <button
                  onClick={() => handleUnpaid(item)}
                  disabled={pending}
                  className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded disabled:opacity-50"
                  title="Mark unpaid"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        );
      })()}
    </div>
  );
}
