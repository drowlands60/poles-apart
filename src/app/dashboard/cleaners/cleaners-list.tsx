"use client";

import { useState, useTransition, useActionState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { createCleaner, deleteCleaner } from "./actions";

interface CleanersListProps {
  cleaners: { id: string; full_name: string; phone: string | null; role: string; created_at: string }[];
  currentUserId: string;
}

export function CleanersList({ cleaners, currentUserId }: CleanersListProps) {
  const [showForm, setShowForm] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} as a cleaner? This will delete their account.`)) return;
    startDeleteTransition(() => {
      deleteCleaner(id);
    });
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-[#3b6d8f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a5070]"
        >
          <UserPlus className="w-4 h-4" />
          Add Cleaner
        </button>
      </div>

      {/* Add form */}
      {showForm && <AddCleanerForm onClose={() => setShowForm(false)} />}

      {/* List */}
      {cleaners.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No cleaners yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {cleaners.map((cleaner) => (
            <div key={cleaner.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{cleaner.full_name}</p>
                <p className="text-xs text-gray-500">
                  {cleaner.phone ?? "No phone"}
                  {" · Added "}
                  {new Date(cleaner.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {cleaner.id !== currentUserId && (
                <button
                  onClick={() => handleDelete(cleaner.id, cleaner.full_name)}
                  disabled={deletePending}
                  className="p-2 text-gray-400 hover:text-red-500 rounded disabled:opacity-50"
                  title="Delete cleaner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Cleaners log in with their email and initial password. They&apos;ll be prompted to change it on first login.
      </p>
    </div>
  );
}

function AddCleanerForm({ onClose }: { onClose: () => void }) {
  async function action(_prevState: { error?: string } | undefined, formData: FormData) {
    const result = await createCleaner(formData);
    return result;
  }

  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">New Cleaner</h3>
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {state.error}
        </div>
      )}
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              id="full_name"
              name="full_name"
              required
              placeholder="e.g. Jake Murray"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="07..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="cleaner@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Initial Password *</label>
            <input
              id="password"
              name="password"
              type="text"
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-medium bg-[#3b6d8f] text-white px-4 py-2 rounded-lg hover:bg-[#2a5070] disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create Cleaner"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
