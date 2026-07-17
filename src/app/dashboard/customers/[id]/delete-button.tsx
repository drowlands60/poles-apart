"use client";

import { Trash2 } from "lucide-react";
import { deleteCustomer } from "../actions";
import { useTransition } from "react";

interface DeleteCustomerButtonProps {
  id: string;
  name: string;
}

export function DeleteCustomerButton({ id, name }: DeleteCustomerButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      return;
    }
    startTransition(() => {
      deleteCustomer(id);
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
