import { redirect } from "next/navigation";
import { requireProfile, ROLE_HOME } from "@/lib/auth";

// Smista ognuno nella propria area in base al ruolo.
export default async function HomeRedirect() {
  const profile = await requireProfile();
  redirect(ROLE_HOME[profile.role]);
}
