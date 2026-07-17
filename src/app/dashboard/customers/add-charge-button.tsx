"use client";

import { useState, useTransition } from "react";
import { PoundSterling } from "lucide-react";
import { createAdhocCharge } from "@/app/dashboard/payments/actions";

interface AddChargeButtonProps {
  customerId: string;
  compact?: boolean;
}

export function AddChargeButton({ customerId, compact }: AddChargeButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    startTransition(async () => {
      await createAdhocCharge(customerId, numAmount, notes);
      setOpen(false);
      setAmount("");
      setNotes("");
    });
  }

  if (!open) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={compact
          ? "p-1.5 text-[#3b6d8f] hover:bg-blue-50 rounded"
          : "inline-flex items-center gap-2 text-sm font-medium bg-blue-50 text-[#3b6d8f] border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100"
        }
        title="Add charge"
      >
        <PoundSterling className="w-4 h-4" />
        {!compact && "Add Charge"}
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />
      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-xl p-5 shadow-xl w-[90vw] max-w-sm" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold text-[#1e3a5f] mb-3">Add Charge</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Amount (£)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Note (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 text-sm font-medium bg-[#3b6d8f] text-white px-4 py-2 rounded-lg hover:bg-[#2a5070] disabled:opacity-50"
            >
              {pending ? "Adding..." : "Add Charge"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
