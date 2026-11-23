import { notFound } from "next/navigation";
import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { AllergenBadges } from "@/components/allergen-badges";
import { CheckboxField } from "@/components/checkbox-field";
import { requireProfile } from "@/lib/auth";
import { ALLERGENS, categoryLabel } from "@/lib/allergens";
import { formatEuro } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { setBasePrice, updateKitchenBase } from "../../../../actions";
import { PriceFields } from "./price-fields";

type Row = {
  id: string;
  kitchen_id: string;
  allergens: string[];
  allergens_declared: boolean;
  available: boolean;
  price_per_kg_cents: number | null;
  bases: { name: string; category: string } | null;
  kitchens: { name: string } | null;
};

type Costs = {
  pricing_mode: "diretto" | "da_costo";
  cost_per_kg_cents: number | null;
  cooking_loss_pct: number | null;
  markup_pct: number | null;
};

export default async function BaseCucinaPage({
  params,
}: PageProps<"/admin/cucine/[id]/basi/[kbId]">) {
  const profile = await requireProfile(["admin"]);
  const { id, kbId } = await params;
  const supabase = await createClient();

  const [{ data }, { data: costsData }] = await Promise.all([
    supabase
      .from("kitchen_bases")
      .select(
        "id, kitchen_id, allergens, allergens_declared, available, price_per_kg_cents, bases(name, category), kitchens(name)",
      )
      .eq("id", kbId)
      .eq("kitchen_id", id)
      .maybeSingle(),
    // Dati riservati: il database li dà solo all'admin.
    supabase
      .from("kitchen_base_costs")
      .select("pricing_mode, cost_per_kg_cents, cooking_loss_pct, markup_pct")
      .eq("kitchen_base_id", kbId)
      .maybeSingle(),
  ]);

  const row = data as unknown as Row | null;
  if (!row || !row.bases) notFound();
  const costs = costsData as Costs | null;

  return (
    <RoleArea
      profile={profile}
      title={row.bases.name}
      back={{ href: `/admin/cucine/${id}`, label: row.kitchens?.name ?? "Gastronomia" }}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {categoryLabel(row.bases.category)} ·{" "}
          {row.price_per_kg_cents ? `${formatEuro(row.price_per_kg_cents)} al kg` : "prezzo non impostato"}
        </p>
        <AllergenBadges declared={row.allergens_declared} allergens={row.allergens} />
      </div>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl">Prezzo</h2>
          <p className="text-xs text-muted-foreground">
            Costo, calo e ricarico sono riservati: il cliente vede solo il prezzo del pasto.
          </p>
        </div>
        <ActionForm action={setBasePrice} submitLabel="Salva prezzo">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="kitchen_id" value={row.kitchen_id} />
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

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <h2 className="text-xl">Allergeni e disponibilità</h2>
        <ActionForm action={updateKitchenBase} submitLabel="Salva allergeni">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="kitchen_id" value={row.kitchen_id} />

          <CheckboxField
            id="declared"
            name="declared"
            label="Allergeni verificati con la cucina"
            hint="Senza questa spunta il cliente vedrà “Allergeni non verificati” e dovrà confermare prima di ordinare."
            defaultChecked={row.allergens_declared}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              Contiene (lascia tutto vuoto se non ci sono allergeni)
            </legend>
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

          <CheckboxField
            id="available"
            name="available"
            label="Disponibile in questa gastronomia"
            defaultChecked={row.available}
          />
        </ActionForm>
      </section>
    </RoleArea>
  );
}
