import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MobileNav } from "./mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-[#1e3a5f]">Poles Apart</h1>
              <div className="hidden md:flex gap-4">
                <a href="/dashboard" className="text-[#3b6d8f] hover:text-[#1e3a5f] px-3 py-2 text-sm font-medium">
                  Dashboard
                </a>
                {profile?.role === "admin" && (
                  <>
                    <a href="/dashboard/customers" className="text-[#3b6d8f] hover:text-[#1e3a5f] px-3 py-2 text-sm font-medium">
                      Customers
                    </a>
                    <a href="/dashboard/rounds" className="text-[#3b6d8f] hover:text-[#1e3a5f] px-3 py-2 text-sm font-medium">
                      Rounds
                    </a>
                    <a href="/dashboard/runs" className="text-[#3b6d8f] hover:text-[#1e3a5f] px-3 py-2 text-sm font-medium">
                      Runs
                    </a>
                    <a href="/dashboard/payments" className="text-[#3b6d8f] hover:text-[#1e3a5f] px-3 py-2 text-sm font-medium">
                      Payments
                    </a>
                  </>
                )}
                <a href="/dashboard/round-view" className="text-[#3b6d8f] hover:text-[#1e3a5f] px-3 py-2 text-sm font-medium">
                  Round View
                </a>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-[#3b6d8f]">
                {profile?.full_name} ({profile?.role})
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-[#3b6d8f] hover:text-[#1e3a5f]"
                >
                  Sign Out
                </button>
              </form>
            </div>
            {/* Mobile hamburger */}
            <MobileNav role={profile?.role ?? "cleaner"} name={profile?.full_name ?? ""} />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
