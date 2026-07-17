import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Poles Apart</h1>
              <div className="hidden md:flex gap-4">
                <a href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Dashboard
                </a>
                {profile?.role === "admin" && (
                  <>
                    <a href="/dashboard/customers" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                      Customers
                    </a>
                    <a href="/dashboard/rounds" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                      Rounds
                    </a>
                    <a href="/dashboard/runs" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                      Runs
                    </a>
                    <a href="/dashboard/payments" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                      Payments
                    </a>
                  </>
                )}
                <a href="/dashboard/round-view" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Round View
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {profile?.full_name} ({profile?.role})
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      {/* Mobile nav */}
      <div className="md:hidden border-b border-gray-200 bg-white px-4 py-2 flex gap-2 overflow-x-auto">
        <a href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-1 text-sm font-medium whitespace-nowrap">
          Dashboard
        </a>
        {profile?.role === "admin" && (
          <>
            <a href="/dashboard/customers" className="text-gray-600 hover:text-gray-900 px-3 py-1 text-sm font-medium whitespace-nowrap">
              Customers
            </a>
            <a href="/dashboard/rounds" className="text-gray-600 hover:text-gray-900 px-3 py-1 text-sm font-medium whitespace-nowrap">
              Rounds
            </a>
            <a href="/dashboard/runs" className="text-gray-600 hover:text-gray-900 px-3 py-1 text-sm font-medium whitespace-nowrap">
              Runs
            </a>
            <a href="/dashboard/payments" className="text-gray-600 hover:text-gray-900 px-3 py-1 text-sm font-medium whitespace-nowrap">
              Payments
            </a>
          </>
        )}
        <a href="/dashboard/round-view" className="text-gray-600 hover:text-gray-900 px-3 py-1 text-sm font-medium whitespace-nowrap">
          Round View
        </a>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
