import { redirect } from "next/navigation";
import { RoleArea } from "@/components/role-area";
import { requireProfile } from "@/lib/auth";
import { BASE_CATEGORIES } from "@/lib/allergens";
import { addDays, DATE_RE, formatCutoff, formatDay, isOrderOpen, romeToday } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "./order-form";

export const metadata = { title: "Ordina · NutriLife" };

type Template = {
  id: string;
  name: string;
  meal_slot: "pranzo" | "cena";
  nutritionist_id: string | null;
  meal_template_items: { id: string; base_id: string; grams: number; choice_group: number | null; bases: { name: string; category: string } | null }[];
};

type KitchenBase = {
  kitchen_id: string;
  base_id: string;
  allergens: string[];
  allergens_declared: boolean;
  available: boolean;
  price_per_kg_cents: number | null;
};

export default async function OrdinaPage({ searchParams }: PageProps<"/cliente/ordina">) {
  const profile = await requireProfile(["cliente"]);
  const { giorno } = await searchParams;
  const day = typeof giorno === "string" && DATE_RE.test(giorno) ? giorno : null;

  const supabase = await createClient();
  const { data: settings } = await supabase.from("app_settings").select("cutoff_hour").maybeSingle();
  const cutoffHour = settings?.cutoff_hour ?? 18;

  // Giorno non valido, troppo lontano o già chiuso: si torna alla settimana.
  if (!day || day > addDays(romeToday(), 14) || !isOrderOpen(day, cutoffHour)) redirect("/cliente");

  const [{ data: tplData }, { data: kitchens }, { data: me }, { data: dayOrders }] = await Promise.all([
    supabase
      .from("meal_templates")
      .select("id, name, meal_slot, nutritionist_id, meal_template_items(id, base_id, grams, choice_group, bases(name, category))")
      .eq("patient_id", profile.id)
      .eq("active", true)
      .order("meal_slot")
      .order("name"),
    supabase.from("kitchens").select("id, name, address, fixed_fee_cents").eq("active", true).order("name"),
    supabase.from("profiles").select("allergies, intolerances").eq("id", profile.id).single(),
    supabase
      .from("orders")
      .select("meal_slot")
      .eq("client_id", profile.id)
      .eq("pickup_date", day)
      .neq("status", "annullato"),
  ]);

  const templates = (tplData ?? []) as unknown as Template[];
  const kitchenIds = (kitchens ?? []).map((k) => k.id);
  const { data: kbData } = kitchenIds.length
    ? await supabase
        .from("kitchen_bases")
        .select("kitchen_id, base_id, allergens, allergens_declared, available, price_per_kg_cents")
        .in("kitchen_id", kitchenIds)
    : { data: [] };
  const kitchenBases = (kbData ?? []) as KitchenBase[];

  const allergies: string[] = me?.allergies ?? [];
  const intolerances: string[] = me?.intolerances ?? [];
  const takenSlots = new Set((dayOrders ?? []).map((o) => o.meal_slot as string));
  const catOrder = (c: string) => BASE_CATEGORIES.findIndex((x) => x.value === c);

  return (
    <RoleArea profile={profile} title={`Ordina per ${formatDay(day)}`} back={{ href: "/cliente", label: "La mia settimana" }}>
      <p className="text-muted-foreground">
        Puoi ordinare o cambiare idea {formatCutoff(day, cutoffHour)}. Paghi al ritiro in gastronomia.
      </p>

      {templates.length === 0 || (kitchens ?? []).length === 0 ? (
        <p className="rounded-lg bg-muted p-4 text-sm">
          Al momento non ci sono pasti tipo o gastronomie disponibili.
        </p>
      ) : (
        <OrderForm
          day={day}
          templates={templates.map((t) => ({
            id: t.id,
            name: t.name,
            slot: t.meal_slot,
            verified: Boolean(t.nutritionist_id),
            taken: takenSlots.has(t.meal_slot),
            items: [...t.meal_template_items]
              .sort(
                (a, b) =>
                  catOrder(a.bases?.category ?? "") - catOrder(b.bases?.category ?? "") ||
                  (a.choice_group ?? 0) - (b.choice_group ?? 0),
              )
              .map((i) => ({
                id: i.id,
                baseId: i.base_id,
                name: i.bases?.name ?? "",
                grams: i.grams,
                category: i.bases?.category ?? "altro",
                group: i.choice_group,
              })),
          }))}
          kitchens={(kitchens ?? []).map((k) => ({
            id: k.id,
            name: k.name,
            address: k.address,
            feeCents: k.fixed_fee_cents ?? 0,
          }))}
          kitchenBases={kitchenBases.map((kb) => ({
            kitchenId: kb.kitchen_id,
            baseId: kb.base_id,
            allergens: kb.allergens,
            declared: kb.allergens_declared,
            available: kb.available,
            priceCents: kb.price_per_kg_cents,
          }))}
          allergies={allergies}
          intolerances={intolerances}
        />
      )}
    </RoleArea>
  );
}
