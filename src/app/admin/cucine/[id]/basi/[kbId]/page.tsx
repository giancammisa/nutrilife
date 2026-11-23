import { notFound } from "next/navigation";
import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { AllergenBadges } from "@/components/allergen-badges";
import { CheckboxField } from "@/components/checkbox-field";
import { requireProfile } from "@/lib/auth";
import { ALLERGENS, categoryLabel } from "@/lib/allergens";
import { createClient } from "@/lib/supabase/server";
import { updateKitchenBase } from "../../../../actions";

type Row = {
  id: string;
  kitchen_id: string;
  allergens: string[];
  allergens_declared: boolean;
  available: boolean;
  bases: { name: string; category: string } | null;
  kitchens: { name: string } | null;
};

export default async function BaseCucinaPage({
  params,
}: PageProps<"/admin/cucine/[id]/basi/[kbId]">) {
  const profile = await requireProfile(["admin"]);
  const { id, kbId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("kitchen_bases")
    .select("id, kitchen_id, allergens, allergens_declared, available, bases(name, category), kitchens(name)")
    .eq("id", kbId)
    .eq("kitchen_id", id)
    .maybeSingle();

  const row = data as unknown as Row | null;
  if (!row || !row.bases) notFound();

  return (
    <RoleArea
      profile={profile}
      title={row.bases.name}
      back={{ href: `/admin/cucine/${id}`, label: row.kitchens?.name ?? "Gastronomia" }}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {categoryLabel(row.bases.category)} · stato attuale
        </p>
        <AllergenBadges declared={row.allergens_declared} allergens={row.allergens} />
      </div>

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
    </RoleArea>
  );
}
