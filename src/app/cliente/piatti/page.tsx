import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { BasePicker } from "@/components/base-picker";
import { MealBlob } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth";
import { BASE_CATEGORIES, categoryLabel } from "@/lib/allergens";
import { createClient } from "@/lib/supabase/server";
import { addDishItem, archiveDish, createDish, removeDishItem, updateDishGrams } from "../actions";

export const metadata = { title: "I miei piatti · NutriLife" };

type Dish = {
  id: string;
  name: string;
  meal_slot: "pranzo" | "cena";
  meal_template_items: {
    id: string;
    grams: number;
    choice_group: number | null;
    bases: { id: string; name: string; category: string } | null;
  }[];
};

const SLOT_LABEL = { pranzo: "Pranzo", cena: "Cena" } as const;

// Piatti composti dal cliente: basi e grammi scelti da lui, cucinati e pesati dai laboratori.
export default async function PiattiPage() {
  const profile = await requireProfile(["cliente"]);
  const supabase = await createClient();

  const [{ data: dishData }, { data: bases }] = await Promise.all([
    supabase
      .from("meal_templates")
      .select("id, name, meal_slot, meal_template_items(id, grams, choice_group, bases(id, name, category))")
      .eq("patient_id", profile.id)
      .is("nutritionist_id", null)
      .eq("active", true)
      .order("meal_slot")
      .order("name"),
    supabase.from("bases").select("id, name, category").eq("active", true).order("name"),
  ]);
  const dishes = (dishData ?? []) as unknown as Dish[];

  return (
    <RoleArea profile={profile} title="I miei piatti" back={{ href: "/cliente", label: "La mia settimana" }}>
      <p className="text-muted-foreground">
        Componi i tuoi piatti con le basi e i grammi che vuoi: li cucinano e li pesano al grammo i laboratori vicino a
        te.
      </p>

      {dishes.map((d) => (
        <DishCard key={d.id} dish={d} bases={bases ?? []} />
      ))}

      <section className="flex flex-col gap-4 rounded-[28px] border bg-card p-5">
        <h2 className="section-title">Nuovo piatto</h2>
        <ActionForm action={createDish} submitLabel="Crea piatto" resetOnSuccess>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required maxLength={60} placeholder="Pranzo leggero" className="h-12 text-base" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="meal_slot">Momento</Label>
            <select
              id="meal_slot"
              name="meal_slot"
              required
              defaultValue="pranzo"
              className="h-12 rounded-lg border border-input bg-white/70 px-3 text-base"
            >
              <option value="pranzo">Pranzo</option>
              <option value="cena">Cena</option>
            </select>
          </div>
        </ActionForm>
      </section>
    </RoleArea>
  );
}

function DishCard({ dish: d, bases }: { dish: Dish; bases: { id: string; name: string; category: string }[] }) {
  const order = (c: string) => BASE_CATEGORIES.findIndex((x) => x.value === c);
  const items = [...d.meal_template_items].sort(
    (a, b) => order(a.bases?.category ?? "") - order(b.bases?.category ?? "") || (a.choice_group ?? 0) - (b.choice_group ?? 0),
  );
  const seen = new Set<number>();
  const shown = items.filter((i) => {
    if (i.choice_group == null) return true;
    if (seen.has(i.choice_group)) return false;
    seen.add(i.choice_group);
    return true;
  });
  const groupSize = (g: number | null) => (g == null ? 0 : items.filter((x) => x.choice_group === g).length);
  const used = new Set(items.map((i) => i.bases?.id));
  const addable = bases.filter((b) => !used.has(b.id));
  const total = shown.reduce((s, i) => s + i.grams, 0);

  return (
    <section className="flex flex-col gap-4 rounded-[28px] border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="section-title">{d.name}</h2>
          <span className="text-sm text-muted-foreground">
            {SLOT_LABEL[d.meal_slot]} · <span className="num text-foreground">{total} g</span> in tutto
          </span>
        </div>
        {shown.length > 0 && (
          <MealBlob items={shown.map((i) => ({ category: i.bases?.category ?? "altro", grams: i.grams }))} size={48} />
        )}
      </div>

      {items.length === 0 && <p className="text-sm text-muted-foreground">Nessuna base. Aggiungine una qui sotto.</p>}

      <ul className="flex flex-col divide-y">
        {items.map((i) => (
          <li key={i.id} className="flex flex-col gap-2 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="card-title">{i.bases?.name}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {groupSize(i.choice_group) > 1 && (
                  <span className="rounded-full bg-lemon px-2 py-0.5 font-semibold text-ink">a scelta</span>
                )}
                {categoryLabel(i.bases?.category ?? "")}
              </span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <ActionForm action={updateDishGrams} submitLabel="Aggiorna grammi">
                <input type="hidden" name="item_id" value={i.id} />
                <div className="flex items-center gap-2">
                  <Input
                    name="grams"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={1000}
                    required
                    defaultValue={i.grams}
                    aria-label={`Grammi di ${i.bases?.name}`}
                    className="h-11 w-28 text-base"
                  />
                  <span className="text-sm text-muted-foreground">grammi</span>
                </div>
              </ActionForm>
              <form action={removeDishItem}>
                <input type="hidden" name="item_id" value={i.id} />
                <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                  Togli
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      {addable.length > 0 && (
        <div className="rounded-[24px] bg-muted p-4">
          <ActionForm action={addDishItem} submitLabel="Aggiungi base" resetOnSuccess>
            <input type="hidden" name="template_id" value={d.id} />
            <BasePicker bases={addable} />
            <div className="flex flex-col gap-2">
              <Label htmlFor={`grams-${d.id}`}>Grammi</Label>
              <Input
                id={`grams-${d.id}`}
                name="grams"
                type="number"
                inputMode="numeric"
                min={1}
                max={1000}
                required
                placeholder="150"
                className="h-12 text-base"
              />
            </div>
            {items.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor={`alt-${d.id}`}>In alternativa a (facoltativo)</Label>
                <select
                  id={`alt-${d.id}`}
                  name="alt_of"
                  defaultValue=""
                  className="h-12 rounded-lg border border-input bg-white/70 px-3 text-base"
                >
                  <option value="">No, c&apos;è sempre</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.bases?.name} {i.grams} g
                    </option>
                  ))}
                </select>
              </div>
            )}
          </ActionForm>
        </div>
      )}

      <form action={archiveDish} className="self-start">
        <input type="hidden" name="template_id" value={d.id} />
        <Button type="submit" variant="ghost" size="sm">
          Togli questo piatto
        </Button>
      </form>
    </section>
  );
}
