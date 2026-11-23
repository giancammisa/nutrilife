"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { isAllergenCode } from "@/lib/allergens";
import { DATE_RE } from "@/lib/dates";
import { text, uuid, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

async function client() {
  const profile = await requireProfile(["cliente"]);
  return { profile, supabase: await createClient() };
}

// ── Allergie e intolleranze ─────────────────────────────

export async function saveAllergies(_prev: FormState, formData: FormData): Promise<FormState> {
  const allergies = [...new Set(formData.getAll("allergies").map(String).filter(isAllergenCode))];
  const intolerances = [...new Set(formData.getAll("intolerances").map(String).filter(isAllergenCode))]
    // un allergene già indicato come allergia non serve anche come intolleranza
    .filter((c) => !allergies.includes(c));
  const consent = formData.get("consent") === "on";

  if (allergies.length + intolerances.length > 0 && !consent) {
    return { error: "Per salvarle serve il consenso al trattamento di questi dati.", ok: null };
  }

  const { supabase } = await client();
  const { error } = await supabase.rpc("set_my_allergies", {
    p_allergies: allergies,
    p_intolerances: intolerances,
    p_consent: consent,
  });
  if (error) return { error: "Salvataggio non riuscito. Riprova.", ok: null };

  revalidatePath("/cliente");
  revalidatePath("/cliente/allergie");
  return {
    error: null,
    ok:
      allergies.length + intolerances.length === 0
        ? "Salvato: nessuna allergia o intolleranza."
        : "Salvato. Ne terremo conto in ogni ordine.",
  };
}

// ── Ordine ──────────────────────────────────────────────

const ORDER_ERRORS: [string, string][] = [
  ["Orario limite superato", "L'orario limite per questo giorno è passato."],
  ["Allergene bloccato", "Questo pasto contiene un allergene che hai indicato: ordine bloccato per la tua sicurezza."],
  ["Conferma allergeni non verificati", "Spunta la conferma sugli allergeni non verificati."],
  ["già un ordine", "Hai già un ordine per questo pasto in quel giorno."],
  ["non disponibile", "Questo pasto non è disponibile in questa gastronomia."],
  ["14 giorni", "Puoi ordinare al massimo 14 giorni prima."],
  ["Pasto tipo non valido", "Pasto tipo non valido."],
];

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const templateId = uuid(formData, "template_id");
  const kitchenId = uuid(formData, "kitchen_id");
  const day = text(formData, "day");
  if (!DATE_RE.test(day)) return { error: "Giorno non valido.", ok: null };
  if (!templateId) return { error: "Scegli un pasto tipo.", ok: null };
  if (!kitchenId) return { error: "Scegli una gastronomia.", ok: null };

  const { supabase } = await client();
  const { error } = await supabase.rpc("place_order", {
    p_template: templateId,
    p_kitchen: kitchenId,
    p_pickup: day,
    p_ack_unverified: formData.get("ack_unverified") === "on",
  });
  if (error) {
    const known = ORDER_ERRORS.find(([key]) => error.message.includes(key));
    return { error: known ? known[1] : "Ordine non riuscito. Riprova.", ok: null };
  }

  revalidatePath("/cliente");
  redirect(`/cliente?ordinato=${day}`);
}

// ── Annullamento ────────────────────────────────────────

export async function cancelOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const orderId = uuid(formData, "order_id");
  if (!orderId) return { error: "Ordine non valido.", ok: null };

  const { supabase } = await client();
  const { error } = await supabase.rpc("cancel_order", { p_order: orderId });
  if (error) {
    if (error.message.includes("Orario limite")) {
      return { error: "L'orario limite è passato: l'ordine non si può più annullare.", ok: null };
    }
    if (error.message.includes("non annullabile")) {
      return { error: "Questo ordine non si può più annullare.", ok: null };
    }
    return { error: "Annullamento non riuscito. Riprova.", ok: null };
  }

  revalidatePath("/cliente");
  revalidatePath("/cliente/ordini");
  return { error: null, ok: "Ordine annullato." };
}
