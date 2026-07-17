"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

interface MobileNavProps {
  role: string;
  name: string;
}

export function MobileNav({ role, name }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-[#3b6d8f] hover:text-[#1e3a5f] rounded-lg"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <div className="px-4 py-3 space-y-1">
            {role === "admin" && (
              <>
                <a href="/dashboard" className="block px-3 py-2 text-[#3b6d8f] hover:bg-slate-50 hover:text-[#1e3a5f] rounded-lg text-sm font-medium">
                  Dashboard
                </a>
                <a href="/dashboard/customers" className="block px-3 py-2 text-[#3b6d8f] hover:bg-slate-50 hover:text-[#1e3a5f] rounded-lg text-sm font-medium">
                  Customers
                </a>
                <a href="/dashboard/rounds" className="block px-3 py-2 text-[#3b6d8f] hover:bg-slate-50 hover:text-[#1e3a5f] rounded-lg text-sm font-medium">
                  Rounds
                </a>
                <a href="/dashboard/runs" className="block px-3 py-2 text-[#3b6d8f] hover:bg-slate-50 hover:text-[#1e3a5f] rounded-lg text-sm font-medium">
                  Runs
                </a>
                <a href="/dashboard/payments" className="block px-3 py-2 text-[#3b6d8f] hover:bg-slate-50 hover:text-[#1e3a5f] rounded-lg text-sm font-medium">
                  Payments
                </a>
                <a href="/dashboard/cleaners" className="block px-3 py-2 text-[#3b6d8f] hover:bg-slate-50 hover:text-[#1e3a5f] rounded-lg text-sm font-medium">
                  Cleaners
                </a>
              </>
            )}
            <a href="/dashboard/round-view" className="block px-3 py-2 text-[#3b6d8f] hover:bg-slate-50 hover:text-[#1e3a5f] rounded-lg text-sm font-medium">
              Run View
            </a>
            <hr className="border-gray-200 my-2" />
            <div className="px-3 py-2 text-xs text-gray-500">{name} ({role})</div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="block w-full text-left px-3 py-2 text-[#3b6d8f] hover:bg-slate-50 hover:text-[#1e3a5f] rounded-lg text-sm font-medium"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
