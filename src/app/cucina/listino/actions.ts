"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { isAllergenCode } from "@/lib/allergens";
import { dbError, text, uuid as id, uuids, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { formatEuro, parseEuroToCents, parsePercent } from "@/lib/pricing";

// Listino della gastronomia. Qui si controlla solo il ruolo:
// che sia la PROPRIA gastronomia lo verifica il database (regole RLS e funzioni).
async function kitchenClient() {
  await requireProfile(["cucina", "admin"]);
  return createClient();
}

function refresh(kitchenBaseId?: string) {
  revalidatePath("/cucina/listino");
  if (kitchenBaseId) revalidatePath(`/cucina/listino/${kitchenBaseId}`);
}

export async function addBase(_prev: FormState, formData: FormData): Promise<FormState> {
  const kitchenId = id(formData, "kitchen_id");
  const baseIds = uuids(formData, "base_id");
  if (!kitchenId) return { error: "Gastronomia non valida.", ok: null };
  if (baseIds.length === 0) return { error: "Scegli almeno una base dal catalogo.", ok: null };

  const supabase = await kitchenClient();
  // Nascono senza prezzo e con allergeni "non verificati": vanno dichiarati.
  const { error } = await supabase
    .from("kitchen_bases")
    .insert(baseIds.map((base_id) => ({ kitchen_id: kitchenId, base_id })));
  if (error) {
    return {
      error: error.code === "23505" ? "Una di queste basi è già nel tuo listino." : dbError(error.code),
      ok: null,
    };
  }
  refresh();
  return {
    error: null,
    ok: baseIds.length === 1
      ? "Base aggiunta. Ora metti prezzo e allergeni."
      : `${baseIds.length} basi aggiunte. Ora metti prezzi e allergeni.`,
  };
}

export async function updateBase(_prev: FormState, formData: FormData): Promise<FormState> {
  const kitchenBaseId = id(formData, "id");
  if (!kitchenBaseId) return { error: "Base non valida.", ok: null };

  const declared = formData.get("declared") === "on";
  const allergens = formData.getAll("allergens").map(String).filter(isAllergenCode);
  if (!declared && allergens.length > 0) {
    return { error: "Hai scelto degli allergeni: spunta anche \"Allergeni verificati\".", ok: null };
  }

  const supabase = await kitchenClient();
  const { data, error } = await supabase
    .from("kitchen_bases")
    .update({
      allergens_declared: declared,
      allergens: declared ? [...new Set(allergens)] : [],
      available: formData.get("available") === "on",
    })
    .eq("id", kitchenBaseId)
    .select("id");
  if (error) return { error: dbError(error.code), ok: null };
  if (!data?.length) return { error: "Non puoi modificare questa base.", ok: null };

  refresh(kitchenBaseId);
  return { error: null, ok: "Allergeni e disponibilità salvati." };
}

export async function setPrice(_prev: FormState, formData: FormData): Promise<FormState> {
  const kitchenBaseId = id(formData, "id");
  if (!kitchenBaseId) return { error: "Base non valida.", ok: null };

  const mode = text(formData, "mode");
  let args: { p_price_cents: number | null; p_cost_cents: number | null; p_loss_pct: number | null; p_markup_pct: number | null };
  if (mode === "diretto") {
    const price = parseEuroToCents(text(formData, "price"));
    if (!price || price > 100000) return { error: "Scrivi il prezzo di vendita al kg (es. 22,00).", ok: null };
    args = { p_price_cents: price, p_cost_cents: null, p_loss_pct: null, p_markup_pct: null };
  } else if (mode === "da_costo") {
    const cost = parseEuroToCents(text(formData, "cost"));
    const loss = text(formData, "loss") === "" ? 0 : parsePercent(text(formData, "loss"));
    const markup = parsePercent(text(formData, "markup"));
    if (!cost || cost > 100000) return { error: "Scrivi il costo al kg dalla fattura (es. 10,00).", ok: null };
    if (loss === null || loss >= 90) return { error: "Calo peso da 0 a 89%.", ok: null };
    if (markup === null || markup > 1000) return { error: "Scrivi il ricarico in % (es. 30).", ok: null };
    args = { p_price_cents: null, p_cost_cents: cost, p_loss_pct: loss, p_markup_pct: markup };
  } else {
    return { error: "Scegli come calcolare il prezzo.", ok: null };
  }

  const supabase = await kitchenClient();
  const { data, error } = await supabase.rpc("set_base_price", { p_kitchen_base: kitchenBaseId, p_mode: mode, ...args });
  if (error) return { error: "Prezzo non salvato: controlla i valori e riprova.", ok: null };

  refresh(kitchenBaseId);
  return { error: null, ok: `Prezzo salvato: ${formatEuro(Number(data))} al kg.` };
}

export async function setFee(_prev: FormState, formData: FormData): Promise<FormState> {
  const kitchenId = id(formData, "kitchen_id");
  if (!kitchenId) return { error: "Gastronomia non valida.", ok: null };
  const feeText = text(formData, "fixed_fee");
  const fee = feeText === "" ? 0 : parseEuroToCents(feeText);
  if (fee === null || fee > 10000) return { error: "Costo fisso non valido (es. 1,50; massimo 100 €).", ok: null };

  const supabase = await kitchenClient();
  const { error } = await supabase.rpc("set_kitchen_fee", { p_kitchen: kitchenId, p_fee_cents: fee });
  if (error) return { error: "Costo fisso non salvato.", ok: null };

  refresh();
  return { error: null, ok: `Costo fisso salvato: ${formatEuro(fee)} a pasto.` };
}
