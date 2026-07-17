import { createClient } from "@supabase/supabase-js";

// Server-only admin client using the secret key.
// Bypasses RLS - use only for server-side operations (e.g. SMS, scheduled jobs).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
