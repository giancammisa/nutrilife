import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "cliente" | "nutrizionista" | "cucina" | "admin";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  active: boolean;
  privacy_consent_at: string | null;
};

// Versione dell'informativa privacy: se cambia il testo, si aumenta e si richiede il consenso.
export const PRIVACY_VERSION = "2026-11-22";

export const ROLE_HOME: Record<Role, string> = {
  cliente: "/cliente",
  nutrizionista: "/nutrizionista",
  cucina: "/cucina",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  cliente: "Cliente",
  nutrizionista: "Nutrizionista",
  cucina: "Cucina",
  admin: "Admin",
};

// Legge il profilo di chi è collegato (una sola volta per richiesta). null se non collegato.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, active, privacy_consent_at")
    .eq("id", userId)
    .single();

  return (data as Profile | null) ?? null;
});

// Da usare in cima a ogni pagina protetta: controlla accesso, consenso, account attivo e ruolo.
export async function requireProfile(allowed?: Role[]): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/accedi");
  if (!profile.privacy_consent_at) redirect("/consenso");
  if (!profile.active) redirect("/sospeso");
  if (allowed && !allowed.includes(profile.role)) redirect(ROLE_HOME[profile.role]);
  return profile;
}
