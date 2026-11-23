"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BASE_CATEGORIES, isAllergenCode } from "@/lib/allergens";

export type FormState = { error: string | null; ok: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function id(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return UUID.test(value) ? value : null;
}

// Ogni azione ricontrolla che sia l'admin: non ci si fida della pagina.
// Il database (RLS) fa comunque lo stesso controllo.
async function adminClient() {
  await requireProfile(["admin"]);
  return createClient();
}

function dbError(code: string | undefined): string {
  if (code === "23505") return "Esiste già un elemento con questo nome.";
  if (code === "42501") return "Non hai i permessi per questa operazione.";
  return "Salvataggio non riuscito. Riprova.";
}

// ── Gastronomie ─────────────────────────────────────────

export async function createKitchen(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name");
  if (name.length < 2) return { error: "Inserisci il nome della gastronomia.", ok: null };

  const supabase = await adminClient();
  const { error } = await supabase.from("kitchens").insert({
    name,
    address: text(formData, "address") || null,
    phone: text(formData, "phone") || null,
  });
  if (error) return { error: dbError(error.code), ok: null };

  revalidatePath("/admin/cucine");
  return { error: null, ok: `Gastronomia "${name}" creata.` };
}

export async function updateKitchen(_prev: FormState, formData: FormData): Promise<FormState> {
  const kitchenId = id(formData, "id");
  const name = text(formData, "name");
  if (!kitchenId) return { error: "Gastronomia non valida.", ok: null };
  if (name.length < 2) return { error: "Inserisci il nome della gastronomia.", ok: null };

  const supabase = await adminClient();
  const { error } = await supabase
    .from("kitchens")
    .update({
      name,
      address: text(formData, "address") || null,
      phone: text(formData, "phone") || null,
      active: formData.get("active") === "on",
    })
    .eq("id", kitchenId);
  if (error) return { error: dbError(error.code), ok: null };

  revalidatePath("/admin/cucine");
  revalidatePath(`/admin/cucine/${kitchenId}`);
  return { error: null, ok: "Modifiche salvate." };
}

// ── Catalogo basi ───────────────────────────────────────

function category(formData: FormData) {
  const value = text(formData, "category");
  return BASE_CATEGORIES.some((c) => c.value === value) ? value : null;
}

export async function createBase(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name");
  const cat = category(formData);
  if (name.length < 2) return { error: "Inserisci il nome della base.", ok: null };
  if (!cat) return { error: "Scegli la categoria.", ok: null };

  const supabase = await adminClient();
  const { error } = await supabase.from("bases").insert({ name, category: cat });
  if (error) return { error: dbError(error.code), ok: null };

  revalidatePath("/admin/basi");
  return { error: null, ok: `Base "${name}" aggiunta al catalogo.` };
}

export async function updateBase(_prev: FormState, formData: FormData): Promise<FormState> {
  const baseId = id(formData, "id");
  const name = text(formData, "name");
  const cat = category(formData);
  if (!baseId) return { error: "Base non valida.", ok: null };
  if (name.length < 2) return { error: "Inserisci il nome della base.", ok: null };
  if (!cat) return { error: "Scegli la categoria.", ok: null };

  const supabase = await adminClient();
  const { error } = await supabase
    .from("bases")
    .update({ name, category: cat, active: formData.get("active") === "on" })
    .eq("id", baseId);
  if (error) return { error: dbError(error.code), ok: null };

  revalidatePath("/admin/basi");
  revalidatePath(`/admin/basi/${baseId}`);
  return { error: null, ok: "Modifiche salvate." };
}

// ── Basi di una gastronomia ─────────────────────────────

export async function addBaseToKitchen(_prev: FormState, formData: FormData): Promise<FormState> {
  const kitchenId = id(formData, "kitchen_id");
  const baseId = id(formData, "base_id");
  if (!kitchenId) return { error: "Gastronomia non valida.", ok: null };
  if (!baseId) return { error: "Scegli una base dal catalogo.", ok: null };

  const supabase = await adminClient();
  // Nasce "non verificata": gli allergeni vanno dichiarati esplicitamente.
  const { error } = await supabase
    .from("kitchen_bases")
    .insert({ kitchen_id: kitchenId, base_id: baseId });
  if (error) {
    return {
      error: error.code === "23505" ? "Questa base è già nella gastronomia." : dbError(error.code),
      ok: null,
    };
  }

  revalidatePath(`/admin/cucine/${kitchenId}`);
  return { error: null, ok: "Base aggiunta. Ora dichiara i suoi allergeni." };
}

export async function updateKitchenBase(_prev: FormState, formData: FormData): Promise<FormState> {
  const kitchenBaseId = id(formData, "id");
  const kitchenId = id(formData, "kitchen_id");
  if (!kitchenBaseId || !kitchenId) return { error: "Base non valida.", ok: null };

  const declared = formData.get("declared") === "on";
  const allergens = formData
    .getAll("allergens")
    .map(String)
    .filter(isAllergenCode);

  if (!declared && allergens.length > 0) {
    return {
      error: "Hai scelto degli allergeni: spunta anche \"Allergeni verificati con la cucina\".",
      ok: null,
    };
  }

  const supabase = await adminClient();
  const { error } = await supabase
    .from("kitchen_bases")
    .update({
      allergens_declared: declared,
      allergens: declared ? [...new Set(allergens)] : [],
      available: formData.get("available") === "on",
    })
    .eq("id", kitchenBaseId);
  if (error) return { error: dbError(error.code), ok: null };

  revalidatePath(`/admin/cucine/${kitchenId}`);
  revalidatePath(`/admin/cucine/${kitchenId}/basi/${kitchenBaseId}`);
  return { error: null, ok: "Allergeni salvati." };
}
