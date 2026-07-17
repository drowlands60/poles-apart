"use client";

import { useActionState } from "react";
import type { Round, Profile } from "@/lib/types";

interface RunCreateFormProps {
  rounds: Round[];
  cleaners: Pick<Profile, "id" | "full_name">[];
  defaultRoundId: string;
  defaultName: string;
  action: (prevState: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string } | undefined>;
}

export function RunCreateForm({ rounds, cleaners, defaultRoundId, defaultName, action }: RunCreateFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 max-w-xl">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="round_id" className="block text-sm font-medium text-gray-700 mb-1">
          From Template
        </label>
        <select
          id="round_id"
          name="round_id"
          defaultValue={defaultRoundId}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">No template (empty run)</option>
          {rounds.map((round) => (
            <option key={round.id} value={round.id}>
              {round.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Customers from the template will be copied into this run. You can add/remove them after.
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Run Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={defaultName}
          placeholder="e.g. Monday - Swindon North"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">
          Date *
        </label>
        <input
          type="date"
          id="scheduled_date"
          name="scheduled_date"
          required
          defaultValue={today}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign Cleaners (1–2)
        </label>
        {cleaners.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No cleaner profiles found. Create cleaner accounts first.</p>
        ) : (
          <div className="space-y-2">
            {cleaners.map((cleaner) => (
              <label key={cleaner.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="cleaner_ids"
                  value={cleaner.id}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{cleaner.full_name}</span>
              </label>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Target: £200 for 1 cleaner, £340 for 2 cleaners.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <a
          href="/dashboard/runs"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create Run"}
        </button>
      </div>
    </form>
  );
}
