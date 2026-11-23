import "server-only";
import { redirect } from "next/navigation";
import { requireProfile, type Profile } from "@/lib/auth";
import { addDays, DATE_RE, romeToday } from "@/lib/dates";
import { UUID } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

export type KitchenContext = {
  profile: Profile;
  kitchen: { id: string; name: string };
  kitchens: { id: string; name: string }[];
  day: string;
  today: string;
  tomorrow: string;
};

// Quale gastronomia e quale giorno mostrare nell'area cucina.
// Cucina: solo le gastronomie a cui è collegata. Admin: tutte (per controllo).
export async function getKitchenContext(params: {
  cucina?: string | string[];
  giorno?: string | string[];
}): Promise<KitchenContext | { profile: Profile; kitchen: null }> {
  const profile = await requireProfile(["cucina", "admin"]);
  const supabase = await createClient();

  let kitchens: { id: string; name: string }[];
  if (profile.role === "admin") {
    const { data } = await supabase.from("kitchens").select("id, name").order("name");
    kitchens = data ?? [];
  } else {
    const { data } = await supabase
      .from("kitchen_members")
      .select("kitchens(id, name)")
      .eq("profile_id", profile.id);
    kitchens = ((data ?? []) as unknown as { kitchens: { id: string; name: string } | null }[])
      .map((r) => r.kitchens)
      .filter((k): k is { id: string; name: string } => Boolean(k));
  }

  const wanted = typeof params.cucina === "string" && UUID.test(params.cucina) ? params.cucina : null;
  const kitchen = kitchens.find((k) => k.id === wanted) ?? kitchens[0] ?? null;
  if (!kitchen) return { profile, kitchen: null };

  const today = romeToday();
  const tomorrow = addDays(today, 1);
  const giorno = typeof params.giorno === "string" && DATE_RE.test(params.giorno) ? params.giorno : tomorrow;
  // Solo da 7 giorni fa a 14 giorni avanti.
  if (giorno < addDays(today, -7) || giorno > addDays(today, 14)) redirect(`/cucina?cucina=${kitchen.id}`);

  return { profile, kitchen, kitchens, day: giorno, today, tomorrow };
}

export type KitchenOrder = {
  id: string;
  client_name: string | null;
  meal_slot: "pranzo" | "cena";
  template_name: string;
  status: "confermato" | "pronto" | "ritirato" | "annullato";
  price_cents: number;
  allergens: string[];
  allergens_unverified: boolean;
  pickup_date: string;
  order_items: { id: string; base_name: string; category: string; grams: number; allergens: string[] }[];
};

export async function getKitchenOrders(kitchenId: string, day: string): Promise<KitchenOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, client_name, meal_slot, template_name, status, price_cents, allergens, allergens_unverified, pickup_date, order_items(id, base_name, category, grams, allergens)",
    )
    .eq("kitchen_id", kitchenId)
    .eq("pickup_date", day)
    .neq("status", "annullato")
    .order("meal_slot")
    .order("client_name");
  return (data ?? []) as unknown as KitchenOrder[];
}
