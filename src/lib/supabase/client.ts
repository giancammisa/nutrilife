import { createBrowserClient } from "@supabase/ssr";

// Collegamento a Supabase dal browser (componenti "use client").
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
