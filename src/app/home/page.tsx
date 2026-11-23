import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireProfile, ROLE_HOME } from "@/lib/auth";
import { INVITE_COOKIE, INVITE_TOKEN } from "@/lib/invite";

// Smista ognuno nella propria area in base al ruolo.
// Se c'è un invito in sospeso (accesso appena fatto), riporta prima all'invito.
export default async function HomeRedirect() {
  const profile = await requireProfile();

  const invite = (await cookies()).get(INVITE_COOKIE)?.value;
  if (invite && INVITE_TOKEN.test(invite)) redirect("/invito/riprendi");

  redirect(ROLE_HOME[profile.role]);
}
