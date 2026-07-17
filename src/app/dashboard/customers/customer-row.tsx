"use client";

import { useRouter } from "next/navigation";

interface CustomerRowProps {
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    address_line1: string;
    city: string;
    postcode: string;
    price: number;
    is_active: boolean;
    rounds: { name: string } | null;
  };
}

export function CustomerRow({ customer }: CustomerRowProps) {
  const router = useRouter();

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {customer.first_name} {customer.last_name}
        </div>
        {customer.phone && (
          <div className="text-sm text-gray-500">{customer.phone}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{customer.address_line1}</div>
        <div className="text-sm text-gray-500">
          {customer.city}, {customer.postcode}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {customer.rounds?.name ?? "—"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        £{Number(customer.price).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            customer.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {customer.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <span className="text-blue-600 font-medium">Edit</span>
      </td>
    </tr>
  );
}
