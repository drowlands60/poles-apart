"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpDown, Filter } from "lucide-react";

interface CustomerWithRound {
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
}

type SortField = "name" | "address" | "round" | "price" | "status" | "balance";
type SortDir = "asc" | "desc";

interface CustomerTableProps {
  customers: CustomerWithRound[];
  roundNames: string[];
  balanceMap: Record<string, number>;
}

export function CustomerTable({ customers, roundNames, balanceMap }: CustomerTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterRound, setFilterRound] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let result = customers;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.address_line1.toLowerCase().includes(q)
      );
    }

    // Filter by round
    if (filterRound) {
      if (filterRound === "__none__") {
        result = result.filter((c) => !c.rounds);
      } else {
        result = result.filter((c) => c.rounds?.name === filterRound);
      }
    }

    // Filter by status
    if (filterStatus === "active") {
      result = result.filter((c) => c.is_active);
    } else if (filterStatus === "inactive") {
      result = result.filter((c) => !c.is_active);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
          break;
        case "address":
          cmp = a.address_line1.localeCompare(b.address_line1);
          break;
        case "round":
          cmp = (a.rounds?.name ?? "").localeCompare(b.rounds?.name ?? "");
          break;
        case "price":
          cmp = Number(a.price) - Number(b.price);
          break;
        case "status":
          cmp = (a.is_active ? 0 : 1) - (b.is_active ? 0 : 1);
          break;
        case "balance":
          cmp = (balanceMap[a.id] ?? 0) - (balanceMap[b.id] ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [customers, search, sortField, sortDir, filterRound, filterStatus]);

  function SortHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    return (
      <th
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
        onClick={() => toggleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-blue-600" : "text-gray-400"}`} />
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterRound}
            onChange={(e) => setFilterRound(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Rounds</option>
            <option value="__none__">No Round</option>
            {roundNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500">
        {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
      </p>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader field="name">Name</SortHeader>
                <SortHeader field="address">Address</SortHeader>
                <SortHeader field="round">Round</SortHeader>
                <SortHeader field="price">Price</SortHeader>
                <SortHeader field="balance">Owed</SortHeader>
                <SortHeader field="status">Status</SortHeader>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(balanceMap[customer.id] ?? 0) > 0 ? (
                      <span className="text-red-700 font-medium">£{balanceMap[customer.id].toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
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
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    No customers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
