import { NextResponse, type NextRequest } from "next/server";
import { INVITE_COOKIE, INVITE_TOKEN } from "@/lib/invite";

// Dopo l'accesso: riporta all'invito ricordato e lo dimentica (così /home non ci torna all'infinito).
export function GET(request: NextRequest) {
  const token = request.cookies.get(INVITE_COOKIE)?.value;
  const url = request.nextUrl.clone();
  url.search = "";
  url.pathname = token && INVITE_TOKEN.test(token) ? `/invito/${token}` : "/home";

  const response = NextResponse.redirect(url);
  response.cookies.delete(INVITE_COOKIE);
  return response;
}
