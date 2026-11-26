"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BASE_CATEGORIES, isAllergenCode } from "@/lib/allergens";
import { dbError as baseDbError, text, uuid as id, type FormState, uuids } from "@/lib/form";
import { formatEuro, parseEuroToCents, parsePercent } from "@/lib/pricing";

// Ogni azione ricontrolla che sia l'admin: non ci si fida della pagina.
// Il database (RLS) fa comunque lo stesso controllo.
async function adminClient() {
  await requireProfile(["admin"]);
  return createClient();
}

function dbError(code: string | undefined): string {
  if (code === "23505") return "Esiste già un elemento con questo nome.";
  return baseDbError(code);
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
  const feeText = text(formData, "fixed_fee");
  const fee = feeText === "" ? 0 : parseEuroToCents(feeText);
  if (fee === null || fee > 10000) {
    return { error: "Costo fisso non valido (es. 1,50; massimo 100 €).", ok: null };
  }

  const supabase = await adminClient();
  const { error } = await supabase
    .from("kitchens")
    .update({
      name,
      address: text(formData, "address") || null,
      phone: text(formData, "phone") || null,
      active: formData.get("active") === "on",
      fixed_fee_cents: fee,
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

// ── Utenti ──────────────────────────────────────────────

const ROLES = ["cliente", "nutrizionista", "cucina", "admin"] as const;

export async function updateUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = id(formData, "id");
  const role = text(formData, "role");
  if (!userId) return { error: "Utente non valido.", ok: null };
  if (!ROLES.includes(role as (typeof ROLES)[number])) return { error: "Ruolo non valido.", ok: null };

  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_user", {
    p_user: userId,
    p_role: role,
    p_active: formData.get("active") === "on",
  });
  if (error) {
    return {
      error: error.message.includes("te stesso")
        ? "Non puoi togliere a te stesso il ruolo di admin."
        : dbError(error.code),
      ok: null,
    };
  }

  revalidatePath("/admin/utenti");
  return { error: null, ok: "Utente aggiornato." };
}

// ── Basi di una gastronomia ─────────────────────────────

export async function addBaseToKitchen(_prev: FormState, formData: FormData): Promise<FormState> {
  const kitchenId = id(formData, "kitchen_id");
  const baseIds = uuids(formData, "base_id");
  if (!kitchenId) return { error: "Gastronomia non valida.", ok: null };
  if (baseIds.length === 0) return { error: "Scegli almeno una base dal catalogo.", ok: null };

  const supabase = await adminClient();
  // Nascono "non verificate": gli allergeni vanno dichiarati esplicitamente.
  const { error } = await supabase
    .from("kitchen_bases")
    .insert(baseIds.map((base_id) => ({ kitchen_id: kitchenId, base_id })));
  if (error) {
    return {
      error: error.code === "23505" ? "Una di queste basi è già nella gastronomia." : dbError(error.code),
      ok: null,
    };
  }

  revalidatePath(`/admin/cucine/${kitchenId}`);
  return {
    error: null,
    ok: baseIds.length === 1
      ? "Base aggiunta. Ora dichiara i suoi allergeni."
      : `${baseIds.length} basi aggiunte. Ora dichiara i loro allergeni.`,
  };
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

// ── Prezzo di una base nella gastronomia ────────────────

export async function setBasePrice(_prev: FormState, formData: FormData): Promise<FormState> {
  const kitchenBaseId = id(formData, "id");
  const kitchenId = id(formData, "kitchen_id");
  if (!kitchenBaseId || !kitchenId) return { error: "Base non valida.", ok: null };

  const mode = text(formData, "mode");
  let args: {
    p_price_cents: number | null;
    p_cost_cents: number | null;
    p_loss_pct: number | null;
    p_markup_pct: number | null;
  };

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

  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("admin_set_base_price", {
    p_kitchen_base: kitchenBaseId,
    p_mode: mode,
    ...args,
  });
  if (error) return { error: "Prezzo non salvato: controlla i valori e riprova.", ok: null };

  revalidatePath(`/admin/cucine/${kitchenId}`);
  revalidatePath(`/admin/cucine/${kitchenId}/basi/${kitchenBaseId}`);
  return { error: null, ok: `Prezzo salvato: ${formatEuro(Number(data))} al kg.` };
}

// ── Chi lavora nella gastronomia ────────────────────────

export async function addKitchenMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const kitchenId = id(formData, "kitchen_id");
  const profileId = id(formData, "profile_id");
  if (!kitchenId) return { error: "Gastronomia non valida.", ok: null };
  if (!profileId) return { error: "Scegli un utente.", ok: null };

  const supabase = await adminClient();
  const { error } = await supabase
    .from("kitchen_members")
    .insert({ kitchen_id: kitchenId, profile_id: profileId });
  if (error) {
    return {
      error: error.code === "23505" ? "Questo utente è già collegato." : dbError(error.code),
      ok: null,
    };
  }

  revalidatePath(`/admin/cucine/${kitchenId}`);
  return { error: null, ok: "Utente collegato alla gastronomia." };
}

export async function removeKitchenMember(formData: FormData): Promise<void> {
  const kitchenId = id(formData, "kitchen_id");
  const profileId = id(formData, "profile_id");
  if (!kitchenId || !profileId) return;

  const supabase = await adminClient();
  await supabase.from("kitchen_members").delete().eq("kitchen_id", kitchenId).eq("profile_id", profileId);
  revalidatePath(`/admin/cucine/${kitchenId}`);
}

// ── Impostazioni ────────────────────────────────────────

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const hour = Number(text(formData, "cutoff_hour"));
  if (!Number.isInteger(hour) || hour < 6 || hour > 23) {
    return { error: "Orario limite non valido.", ok: null };
  }

  const supabase = await adminClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ cutoff_hour: hour, beta_mode: formData.get("beta_mode") === "on" })
    .eq("id", true);
  if (error) return { error: dbError(error.code), ok: null };

  revalidatePath("/", "layout");
  return { error: null, ok: "Impostazioni salvate." };
}
