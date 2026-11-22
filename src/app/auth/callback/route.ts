import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Arrivo dal link nell'email: scambia il codice monouso con la sessione e porta nell'app.
export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  url.search = "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  url.pathname = "/accedi";
  url.searchParams.set("errore", "link");
  return NextResponse.redirect(url);
}
