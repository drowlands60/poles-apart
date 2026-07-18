import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customer_id, latitude, longitude } = await request.json();

  if (!customer_id || typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Only update if lat/lng are not already set
  await supabase
    .from("customers")
    .update({ latitude, longitude })
    .eq("id", customer_id)
    .is("latitude", null);

  return NextResponse.json({ ok: true });
}
