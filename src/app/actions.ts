"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRIVACY_VERSION } from "@/lib/auth";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type ConsentState = { error: string | null };

export async function giveConsent(
  _prev: ConsentState,
  formData: FormData,
): Promise<ConsentState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const accepted = formData.get("privacy") === "on";

  if (fullName.length < 2) return { error: "Inserisci nome e cognome." };
  if (!accepted) return { error: "Per usare NutriLife devi accettare l'informativa privacy." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/accedi");

  const { error } = await supabase.rpc("give_privacy_consent", {
    p_version: PRIVACY_VERSION,
    p_full_name: fullName,
  });
  if (error) return { error: "Non siamo riusciti a salvare il consenso. Riprova." };

  redirect("/home");
}
