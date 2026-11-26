"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dbError, text, UUID, uuid, type FormState } from "@/lib/form";
import { ACCEPTED_TYPES, extractDietPlan, MAX_FILE_BYTES, type ExtractedPlan } from "@/lib/diet-plan";

// Ogni azione ricontrolla il ruolo; il database (RLS) controlla anche che il paziente sia suo.
async function nutritionist() {
  const profile = await requireProfile(["nutrizionista"]);
  return { profile, supabase: await createClient() };
}

// ── Inviti ──────────────────────────────────────────────

export type InviteState = { error: string | null; link: string | null; label: string | null };

export async function createInvite(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const label = text(formData, "label").slice(0, 80);
  if (label.length < 2) {
    return { error: "Scrivi un nome per riconoscere l'invito (es. Mario R.).", link: null, label: null };
  }

  const { profile, supabase } = await nutritionist();

  // Codice casuale per il link; nel database finisce solo la sua impronta (sha256).
  const token = randomBytes(24).toString("base64url");
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");

  const { error } = await supabase
    .from("invites")
    .insert({ nutritionist_id: profile.id, token_hash: tokenHash, label });
  if (error) return { error: dbError(error.code), link: null, label: null };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  revalidatePath("/nutrizionista");
  return { error: null, link: `${proto}://${host}/invito/${token}`, label };
}

// ── Pasti tipo ──────────────────────────────────────────

const SLOTS = ["pranzo", "cena"];

export async function createTemplate(_prev: FormState, formData: FormData): Promise<FormState> {
  const patientId = uuid(formData, "patient_id");
  const name = text(formData, "name");
  const slot = text(formData, "meal_slot");
  if (!patientId) return { error: "Paziente non valido.", ok: null };
  if (name.length < 1) return { error: "Dai un nome al pasto tipo (es. Pranzo A).", ok: null };
  if (!SLOTS.includes(slot)) return { error: "Scegli pranzo o cena.", ok: null };

  const { profile, supabase } = await nutritionist();
  const { error } = await supabase.from("meal_templates").insert({
    patient_id: patientId,
    nutritionist_id: profile.id,
    name: name.slice(0, 60),
    meal_slot: slot,
    notes: text(formData, "notes").slice(0, 300) || null,
  });
  if (error) return { error: dbError(error.code), ok: null };

  revalidatePath(`/nutrizionista/pazienti/${patientId}`);
  return { error: null, ok: `Pasto tipo "${name}" creato. Ora aggiungi le basi.` };
}

function grams(formData: FormData): number | null {
  const value = Number(text(formData, "grams"));
  return Number.isInteger(value) && value >= 1 && value <= 1000 ? value : null;
}

export async function addTemplateItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const templateId = uuid(formData, "template_id");
  const patientId = uuid(formData, "patient_id");
  const baseId = uuid(formData, "base_id");
  const g = grams(formData);
  if (!templateId || !patientId) return { error: "Pasto tipo non valido.", ok: null };
  if (!baseId) return { error: "Scegli una base.", ok: null };
  if (!g) return { error: "Indica i grammi (da 1 a 1000).", ok: null };

  const altOf = uuid(formData, "alt_of");
  const { supabase } = await nutritionist();

  // In alternativa a un'altra base: stesso gruppo di scelta (se non c'è, se ne crea uno nuovo).
  let group: number | null = null;
  if (altOf) {
    const { data: rows } = await supabase
      .from("meal_template_items")
      .select("id, choice_group")
      .eq("template_id", templateId);
    const target = rows?.find((r) => r.id === altOf);
    if (!target) return { error: "La base di riferimento non è in questo pasto.", ok: null };
    group = target.choice_group ?? Math.max(0, ...(rows ?? []).map((r) => r.choice_group ?? 0)) + 1;
    if (target.choice_group == null) {
      const { error: upErr } = await supabase
        .from("meal_template_items")
        .update({ choice_group: group })
        .eq("id", altOf);
      if (upErr) return { error: dbError(upErr.code), ok: null };
    }
  }

  const { error } = await supabase
    .from("meal_template_items")
    .insert({ template_id: templateId, base_id: baseId, grams: g, choice_group: group });
  if (error) {
    return {
      error: error.code === "23505" ? "Questa base è già nel pasto tipo." : dbError(error.code),
      ok: null,
    };
  }

  revalidatePath(`/nutrizionista/pazienti/${patientId}`);
  return { error: null, ok: group ? "Alternativa aggiunta." : "Base aggiunta." };
}

export async function updateItemGrams(_prev: FormState, formData: FormData): Promise<FormState> {
  const itemId = uuid(formData, "item_id");
  const patientId = uuid(formData, "patient_id");
  const g = grams(formData);
  if (!itemId || !patientId) return { error: "Riga non valida.", ok: null };
  if (!g) return { error: "Grammi da 1 a 1000.", ok: null };

  const { supabase } = await nutritionist();
  const { error } = await supabase.from("meal_template_items").update({ grams: g }).eq("id", itemId);
  if (error) return { error: dbError(error.code), ok: null };

  revalidatePath(`/nutrizionista/pazienti/${patientId}`);
  return { error: null, ok: "Salvato." };
}

export async function removeTemplateItem(formData: FormData): Promise<void> {
  const itemId = uuid(formData, "item_id");
  const patientId = uuid(formData, "patient_id");
  if (!itemId || !patientId) return;

  const { supabase } = await nutritionist();
  await supabase.from("meal_template_items").delete().eq("id", itemId);
  revalidatePath(`/nutrizionista/pazienti/${patientId}`);
}

export async function setTemplateActive(formData: FormData): Promise<void> {
  const templateId = uuid(formData, "template_id");
  const patientId = uuid(formData, "patient_id");
  if (!templateId || !patientId) return;

  const { supabase } = await nutritionist();
  await supabase
    .from("meal_templates")
    .update({ active: formData.get("active") === "true" })
    .eq("id", templateId);
  revalidatePath(`/nutrizionista/pazienti/${patientId}`);
}

// ── Pasti tipo da un piano dieta (PDF o foto) ───────────

export type PlanResult =
  | { ok: true; plan: ExtractedPlan }
  | { ok: false; error: string };

// Legge il piano con l'AI e restituisce una PROPOSTA. Non salva nulla, nemmeno il file.
export async function readDietPlan(formData: FormData): Promise<PlanResult> {
  await nutritionist();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Scegli un PDF o una foto del piano." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "Il file è troppo grande (massimo 4 MB)." };
  const mediaType = ACCEPTED_TYPES.find((t) => t === file.type);
  if (!mediaType) return { ok: false, error: "Formato non supportato: usa un PDF o una foto JPG/PNG." };
  if (formData.get("privacy") !== "on") {
    return { ok: false, error: "Conferma di aver coperto nome, peso ed esami del paziente." };
  }

  const supabase = await createClient();
  const { data: catalog } = await supabase.from("bases").select("id, name, category").eq("active", true).order("name");
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const result = await extractDietPlan({ data, mediaType }, catalog ?? []);
  return "plan" in result ? { ok: true, plan: result.plan } : { ok: false, error: result.error };
}

export type ReviewedMeal = {
  name: string;
  slot: "pranzo" | "cena";
  items: { base_id: string; grams: number; choice_group: number | null }[];
};

// Crea i pasti tipo dalla proposta rivista dal nutrizionista.
export async function createTemplatesFromPlan(
  patientId: string,
  meals: ReviewedMeal[],
): Promise<{ error: string | null; ok: string | null }> {
  if (!UUID.test(patientId)) return { error: "Paziente non valido.", ok: null };
  const clean = meals
    .slice(0, 12)
    .map((m) => ({
      name: String(m.name ?? "").trim().slice(0, 60),
      slot: m.slot === "cena" ? "cena" : "pranzo",
      items: (m.items ?? [])
        .filter((i) => UUID.test(String(i.base_id)) && Number.isInteger(i.grams) && i.grams >= 1 && i.grams <= 1000)
        .map((i) => ({
          base_id: String(i.base_id),
          grams: i.grams,
          choice_group: Number.isInteger(i.choice_group) && (i.choice_group as number) >= 1 && (i.choice_group as number) <= 50 ? i.choice_group : null,
        })),
    }))
    .filter((m) => m.name.length > 0 && m.items.length > 0);
  if (clean.length === 0) return { error: "Nessun pasto completo da creare: ogni pasto ha bisogno di un nome e di almeno una base.", ok: null };
  for (const m of clean) {
    if (new Set(m.items.map((i) => i.base_id)).size !== m.items.length) {
      return { error: `In "${m.name}" la stessa base compare due volte: togline una.`, ok: null };
    }
  }

  const { profile, supabase } = await nutritionist();
  let created = 0;
  for (const m of clean) {
    const { data: tpl, error } = await supabase
      .from("meal_templates")
      .insert({ patient_id: patientId, nutritionist_id: profile.id, name: m.name, meal_slot: m.slot, notes: null })
      .select("id")
      .single();
    if (error || !tpl) return { error: `${created} pasti creati, poi errore su "${m.name}": ${dbError(error?.code)}`, ok: null };
    const { error: itemsError } = await supabase
      .from("meal_template_items")
      .insert(m.items.map((i) => ({ ...i, template_id: tpl.id })));
    if (itemsError) {
      await supabase.from("meal_templates").delete().eq("id", tpl.id);
      return { error: `${created} pasti creati, poi errore sulle basi di "${m.name}".`, ok: null };
    }
    created += 1;
  }

  revalidatePath(`/nutrizionista/pazienti/${patientId}`);
  return { error: null, ok: `${created} ${created === 1 ? "pasto tipo creato" : "pasti tipo creati"}.` };
}

// ── Gold (dopo il controllo) ────────────────────────────

export async function awardGold(formData: FormData): Promise<void> {
  const patientId = uuid(formData, "patient_id");
  if (!patientId) return;
  const { profile, supabase } = await nutritionist();
  // RLS: solo ai propri pazienti
  await supabase.from("gold_awards").insert({ client_id: patientId, nutritionist_id: profile.id });
  revalidatePath(`/nutrizionista/pazienti/${patientId}`);
}

export async function removeGold(formData: FormData): Promise<void> {
  const goldId = uuid(formData, "gold_id");
  const patientId = uuid(formData, "patient_id");
  if (!goldId || !patientId) return;
  const { profile, supabase } = await nutritionist();
  await supabase.from("gold_awards").delete().eq("id", goldId).eq("nutritionist_id", profile.id);
  revalidatePath(`/nutrizionista/pazienti/${patientId}`);
}
