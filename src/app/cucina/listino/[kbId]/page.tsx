import { notFound } from "next/navigation";
import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { AllergenBadges } from "@/components/allergen-badges";
import { CheckboxField } from "@/components/checkbox-field";
import { PriceFields } from "@/app/admin/cucine/[id]/basi/[kbId]/price-fields";
import { requireProfile } from "@/lib/auth";
import { ALLERGENS, categoryLabel } from "@/lib/allergens";
import { UUID_RE } from "@/lib/pickup";
import { formatEuro } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { setPrice, updateBase } from "../actions";

export const metadata = { title: "Base del listino · NutriLife" };

type Row = {
  id: string;
  kitchen_id: string;
  allergens: string[];
  allergens_declared: boolean;
  available: boolean;
  price_per_kg_cents: number | null;
  bases: { name: string; category: string } | null;
};

type Costs = {
  pricing_mode: "diretto" | "da_costo";
  cost_per_kg_cents: number | null;
  cooking_loss_pct: number | null;
  markup_pct: number | null;
};

// Una base del listino: prezzo (diretto o dal costo), allergeni, disponibilità.
export default async function ListinoBasePage({ params }: PageProps<"/cucina/listino/[kbId]">) {
  const profile = await requireProfile(["cucina", "admin"]);
  const { kbId } = await params;
  if (!UUID_RE.test(kbId)) notFound();
  const supabase = await createClient();

  const [{ data }, { data: costsData }, { data: member }] = await Promise.all([
    supabase
      .from("kitchen_bases")
      .select("id, kitchen_id, allergens, allergens_declared, available, price_per_kg_cents, bases(name, category)")
      .eq("id", kbId)
      .maybeSingle(),
    // Dati riservati: il database li dà solo all'admin e alla cucina di questa gastronomia.
    supabase
      .from("kitchen_base_costs")
      .select("pricing_mode, cost_per_kg_cents, cooking_loss_pct, markup_pct")
      .eq("kitchen_base_id", kbId)
      .maybeSingle(),
    supabase.from("kitchen_members").select("kitchen_id").eq("profile_id", profile.id),
  ]);

  const row = data as unknown as Row | null;
  if (!row || !row.bases) notFound();
  // La cucina vede solo le basi delle sue gastronomie.
  if (profile.role !== "admin" && !(member ?? []).some((m) => m.kitchen_id === row.kitchen_id)) notFound();
  const costs = costsData as Costs | null;
  const back = `/cucina/listino?cucina=${row.kitchen_id}`;

  return (
    <RoleArea profile={profile} title={row.bases.name} back={{ href: back, label: "Listino" }}>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {categoryLabel(row.bases.category)} ·{" "}
          {row.price_per_kg_cents ? `${formatEuro(row.price_per_kg_cents)} al kg` : "prezzo non impostato"}
        </p>
        <AllergenBadges declared={row.allergens_declared} allergens={row.allergens} />
      </div>

      <section className="flex flex-col gap-4 rounded-[28px] border bg-card p-5">
        <div className="flex flex-col gap-1">
          <h2 className="section-title">Prezzo</h2>
          <p className="text-sm text-muted-foreground">
            Costo, calo e ricarico restano riservati: il cliente vede solo il prezzo del pasto.
          </p>
        </div>
        <ActionForm action={setPrice} submitLabel="Salva prezzo">
          <input type="hidden" name="id" value={row.id} />
          <PriceFields
            initial={{
              mode: costs?.pricing_mode ?? "da_costo",
              priceCents: row.price_per_kg_cents,
              costCents: costs?.cost_per_kg_cents ?? null,
              lossPct: costs?.cooking_loss_pct != null ? Number(costs.cooking_loss_pct) : null,
              markupPct: costs?.markup_pct != null ? Number(costs.markup_pct) : null,
            }}
          />
        </ActionForm>
      </section>

      <section className="flex flex-col gap-4 rounded-[28px] border bg-card p-5">
        <h2 className="section-title">Allergeni e disponibilità</h2>
        <ActionForm action={updateBase} submitLabel="Salva allergeni">
          <input type="hidden" name="id" value={row.id} />
          <CheckboxField
            id="declared"
            name="declared"
            label="Allergeni verificati"
            hint="Senza questa spunta il cliente vedrà “Allergeni non verificati” e dovrà confermare prima di ordinare."
            defaultChecked={row.allergens_declared}
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-base font-semibold">Contiene (lascia vuoto se non ci sono allergeni)</legend>
            {ALLERGENS.map((a) => (
              <CheckboxField
                key={a.code}
                id={`allergen-${a.code}`}
                name="allergens"
                value={a.code}
                label={a.name}
                defaultChecked={row.allergens.includes(a.code)}
              />
            ))}
          </fieldset>
          <CheckboxField id="available" name="available" label="Disponibile (si può ordinare)" defaultChecked={row.available} />
        </ActionForm>
      </section>
    </RoleArea>
  );
}
