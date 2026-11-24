"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dbError, text, uuid, type FormState } from "@/lib/form";

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
