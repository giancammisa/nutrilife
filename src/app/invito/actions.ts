"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { INVITE_COOKIE, INVITE_TOKEN as TOKEN } from "@/lib/invite";

export type AcceptState = { error: string | null; nutritionist: string | null };

// Chi non ha ancora fatto l'accesso o dato il consenso: ricordiamo l'invito per un giorno.
// /home lo manda ad accedere e al Benvenuto, poi lo riporta qui.
export async function rememberInviteAndLogin(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  if (TOKEN.test(token)) {
    (await cookies()).set(INVITE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  }
  redirect("/home");
}

const ERRORS: Record<string, string> = {
  "Invito non valido": "Questo invito non esiste. Controlla il link o chiedine uno nuovo al nutrizionista.",
  "Invito già usato": "Questo invito è già stato usato da un'altra persona.",
  "Invito scaduto": "L'invito è scaduto. Chiedine uno nuovo al nutrizionista.",
  "Solo un cliente può accettare un invito": "Questo account non è un account cliente.",
  "Sei già collegato a un nutrizionista": "Sei già collegato a un nutrizionista.",
};

export async function acceptInvite(_prev: AcceptState, formData: FormData): Promise<AcceptState> {
  const token = String(formData.get("token") ?? "");
  if (!TOKEN.test(token)) return { error: ERRORS["Invito non valido"], nutritionist: null };
  if (!(await getUserId())) redirect("/accedi");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });

  (await cookies()).delete(INVITE_COOKIE);

  if (error) {
    const known = Object.keys(ERRORS).find((k) => error.message.includes(k));
    return { error: known ? ERRORS[known] : "Non siamo riusciti ad accettare l'invito. Riprova.", nutritionist: null };
  }
  return { error: null, nutritionist: String(data) };
}
