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
  privacy_consent_version: string | null;
  /** Ruoli tra cui l'account puo' passare con "Cambia vista" (vuoto = solo il suo). */
  allowed_roles: Role[];
  /** Il cliente condivide i suoi ordini ritirati con il suo nutrizionista (SQL 0015). */
  share_orders: boolean;
};

// Versione dell'informativa privacy: se cambia il testo, si aumenta e tutti ridanno il consenso.
export const PRIVACY_VERSION = "2026-11-23";

// Consenso valido solo se dato sull'informativa attuale.
export function hasCurrentConsent(profile: Profile): boolean {
  return Boolean(profile.privacy_consent_at) && profile.privacy_consent_version === PRIVACY_VERSION;
}

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

// Id di chi è collegato (una sola volta per richiesta). null se non collegato.
export const getUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  return claims?.claims?.sub ?? null;
});

// Legge il profilo di chi è collegato (una sola volta per richiesta).
// null se non collegato oppure se il profilo non esiste (database non preparato).
export const getProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!data) return null;
  // "*" cosi' l'app funziona anche prima che la colonna allowed_roles esista nel database.
  const row = data as Omit<Profile, "allowed_roles" | "share_orders"> & {
    allowed_roles?: Role[] | null;
    share_orders?: boolean | null;
  };
  return { ...row, allowed_roles: row.allowed_roles ?? [], share_orders: row.share_orders ?? false };
});

// Da usare in cima a ogni pagina protetta: controlla accesso, consenso, account attivo e ruolo.
export async function requireProfile(allowed?: Role[]): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect((await getUserId()) ? "/profilo-mancante" : "/accedi");
  if (!hasCurrentConsent(profile)) redirect("/consenso");
  if (!profile.active) redirect("/sospeso");
  if (allowed && !allowed.includes(profile.role)) redirect(ROLE_HOME[profile.role]);
  return profile;
}
