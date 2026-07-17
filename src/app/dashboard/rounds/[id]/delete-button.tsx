"use client";

import { Trash2 } from "lucide-react";
import { deleteRound } from "../actions";
import { useTransition } from "react";

interface DeleteRoundButtonProps {
  id: string;
  name: string;
}

export function DeleteRoundButton({ id, name }: DeleteRoundButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${name}"? Customers will be unassigned from this template.`)) {
      return;
    }
    startTransition(() => {
      deleteRound(id);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
