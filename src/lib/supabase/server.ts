import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Collegamento a Supabase dal server (pagine, Server Actions).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chiamato da un Server Component: i cookie li aggiorna il proxy.
          }
        },
      },
    },
  );
}
