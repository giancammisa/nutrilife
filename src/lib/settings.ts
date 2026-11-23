import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AppSettings = { cutoffHour: number; betaMode: boolean };

// Impostazioni dell'app (una riga in app_settings), lette una sola volta per richiesta.
// Se non si possono leggere (utente non collegato), valori prudenti: 18:00 e modalità prova attiva.
export const getSettings = cache(async (): Promise<AppSettings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("cutoff_hour, beta_mode").maybeSingle();
  return { cutoffHour: data?.cutoff_hour ?? 18, betaMode: data?.beta_mode ?? true };
});
