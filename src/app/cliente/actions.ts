"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { isAllergenCode } from "@/lib/allergens";
import { DATE_RE } from "@/lib/dates";
import { text, UUID, uuid, type FormState } from "@/lib/form";
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
  ["alternative", "Scegli una base per ogni scelta del pasto."],
  ["Parti del pasto", "Le parti del pasto non sono valide: ricontrolla dove ritirare ogni base."],
];

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const templateId = uuid(formData, "template_id");
  const day = text(formData, "day");
  if (!DATE_RE.test(day)) return { error: "Giorno non valido.", ok: null };
  if (!templateId) return { error: "Scegli un pasto tipo.", ok: null };

  // Parti del pasto: [{ kitchen_id, items: [id riga, ...] }], una per punto vendita.
  let list: { kitchen_id: string; items: string[] }[] = [];
  try {
    const raw: unknown = JSON.parse(text(formData, "parts"));
    if (Array.isArray(raw)) {
      list = raw
        .map((p) => ({
          kitchen_id: String((p as { kitchen_id?: unknown }).kitchen_id ?? ""),
          items: Array.isArray((p as { items?: unknown }).items) ? (p as { items: unknown[] }).items.map(String) : [],
        }))
        .filter((p) => UUID.test(p.kitchen_id) && p.items.length > 0 && p.items.every((i) => UUID.test(i)));
    }
  } catch {
    list = [];
  }
  if (list.length === 0) return { error: "Scegli dove ritirare il pasto.", ok: null };

  const { supabase } = await client();
  const { error } = await supabase.rpc("place_meal", {
    p_template: templateId,
    p_pickup: day,
    p_ack_unverified: formData.get("ack_unverified") === "on",
    p_parts: list,
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

// ── I miei piatti (cliente senza nutrizionista, o in aggiunta) ──
// Il database permette al cliente di modificare solo i piatti suoi (senza nutrizionista).

const DISH_SLOTS = ["pranzo", "cena"];

function grams(formData: FormData): number | null {
  const value = Number(text(formData, "grams"));
  return Number.isInteger(value) && value >= 1 && value <= 1000 ? value : null;
}

function dbMessage(code: string | undefined): string {
  if (code === "23505") return "Questa base è già nel piatto.";
  if (code === "42501") return "Questo piatto non si può modificare.";
  return "Operazione non riuscita. Riprova.";
}

export async function createDish(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name").slice(0, 60);
  const slot = text(formData, "meal_slot");
  if (name.length < 1) return { error: "Dai un nome al piatto (es. Pranzo leggero).", ok: null };
  if (!DISH_SLOTS.includes(slot)) return { error: "Scegli pranzo o cena.", ok: null };

  const { profile, supabase } = await client();
  const { error } = await supabase
    .from("meal_templates")
    .insert({ patient_id: profile.id, nutritionist_id: null, name, meal_slot: slot });
  if (error) return { error: dbMessage(error.code), ok: null };

  revalidatePath("/cliente/piatti");
  revalidatePath("/cliente");
  return { error: null, ok: `Piatto "${name}" creato. Ora aggiungi le basi.` };
}

export async function addDishItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const templateId = uuid(formData, "template_id");
  const baseId = uuid(formData, "base_id");
  const g = grams(formData);
  if (!templateId) return { error: "Piatto non valido.", ok: null };
  if (!baseId) return { error: "Scegli una base.", ok: null };
  if (!g) return { error: "Indica i grammi (da 1 a 1000).", ok: null };

  const altOf = uuid(formData, "alt_of");
  const { supabase } = await client();

  let group: number | null = null;
  if (altOf) {
    const { data: rows } = await supabase
      .from("meal_template_items")
      .select("id, choice_group")
      .eq("template_id", templateId);
    const target = rows?.find((r) => r.id === altOf);
    if (!target) return { error: "La base di riferimento non è in questo piatto.", ok: null };
    group = target.choice_group ?? Math.max(0, ...(rows ?? []).map((r) => r.choice_group ?? 0)) + 1;
    if (target.choice_group == null) {
      const { error: upErr } = await supabase.from("meal_template_items").update({ choice_group: group }).eq("id", altOf);
      if (upErr) return { error: dbMessage(upErr.code), ok: null };
    }
  }

  const { error } = await supabase
    .from("meal_template_items")
    .insert({ template_id: templateId, base_id: baseId, grams: g, choice_group: group });
  if (error) return { error: dbMessage(error.code), ok: null };

  revalidatePath("/cliente/piatti");
  revalidatePath("/cliente");
  return { error: null, ok: group ? "Alternativa aggiunta." : "Base aggiunta." };
}

export async function updateDishGrams(_prev: FormState, formData: FormData): Promise<FormState> {
  const itemId = uuid(formData, "item_id");
  const g = grams(formData);
  if (!itemId) return { error: "Riga non valida.", ok: null };
  if (!g) return { error: "Grammi da 1 a 1000.", ok: null };

  const { supabase } = await client();
  const { data, error } = await supabase.from("meal_template_items").update({ grams: g }).eq("id", itemId).select("id");
  if (error || !data?.length) return { error: dbMessage(error?.code ?? "42501"), ok: null };

  revalidatePath("/cliente/piatti");
  return { error: null, ok: "Salvato." };
}

export async function removeDishItem(formData: FormData): Promise<void> {
  const itemId = uuid(formData, "item_id");
  if (!itemId) return;
  const { supabase } = await client();
  await supabase.from("meal_template_items").delete().eq("id", itemId);
  revalidatePath("/cliente/piatti");
  revalidatePath("/cliente");
}

export async function archiveDish(formData: FormData): Promise<void> {
  const templateId = uuid(formData, "template_id");
  if (!templateId) return;
  const { supabase } = await client();
  await supabase.from("meal_templates").update({ active: false }).eq("id", templateId).is("nutritionist_id", null);
  revalidatePath("/cliente/piatti");
  revalidatePath("/cliente");
}

// ── Condivisione degli ordini con il nutrizionista ──────

export async function setShareOrders(formData: FormData): Promise<void> {
  const { profile, supabase } = await client();
  await supabase.from("profiles").update({ share_orders: formData.get("share") === "true" }).eq("id", profile.id);
  revalidatePath("/cliente");
}
