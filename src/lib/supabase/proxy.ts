import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pagine aperte a tutti (senza accesso).
const PUBLIC_PATHS = ["/", "/accedi", "/privacy", "/auth/callback"];

// Rinnova la sessione a ogni richiesta e manda chi non è collegato alla pagina di accesso.
// È solo un primo filtro: i controlli veri li fanno il database (RLS) e le pagine.
export async function updateSession(request: NextRequest) {
  // Il link nell'email può riportare sulla pagina principale con ?code=…: lo giriamo al callback.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    url.search = "";
    url.searchParams.set("code", code);
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Non mettere codice tra createServerClient e getClaims: serve a rinnovare la sessione.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims?.sub);

  const path = request.nextUrl.pathname;
  if (!isLoggedIn && !PUBLIC_PATHS.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/accedi";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
