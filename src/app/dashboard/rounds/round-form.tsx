"use client";

import { useActionState } from "react";
import type { Round } from "@/lib/types";

interface RoundFormProps {
  round?: Round;
  action: (prevState: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string } | undefined>;
  submitLabel: string;
}

export function RoundForm({ round, action, submitLabel }: RoundFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 max-w-xl">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={round?.name ?? ""}
          placeholder="e.g. Monday - Swindon North"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          id="description"
          name="description"
          defaultValue={round?.description ?? ""}
          placeholder="Optional description"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="frequency_weeks" className="block text-sm font-medium text-gray-700 mb-1">
            Frequency (weeks)
          </label>
          <input
            type="number"
            id="frequency_weeks"
            name="frequency_weeks"
            min="1"
            max="52"
            defaultValue={round?.frequency_weeks ?? 4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <a
          href="/dashboard/rounds"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
