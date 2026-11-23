import { ComingSoon, RoleArea } from "@/components/role-area";
import { requireProfile } from "@/lib/auth";
import { BASE_CATEGORIES } from "@/lib/allergens";
import { formatEuro } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "La mia settimana · NutriLife" };

type Template = {
  id: string;
  name: string;
  meal_slot: "pranzo" | "cena";
  notes: string | null;
  meal_template_items: { id: string; grams: number; bases: { name: string; category: string } | null }[];
};

const SLOT_LABEL = { pranzo: "Pranzo", cena: "Cena" } as const;

export default async function ClientePage() {
  const profile = await requireProfile(["cliente"]);
  const supabase = await createClient();

  const [{ data: link }, { data }] = await Promise.all([
    supabase
      .from("nutritionist_patients")
      .select("nutritionist:profiles!nutritionist_patients_nutritionist_id_fkey(full_name)")
      .eq("patient_id", profile.id)
      .maybeSingle(),
    supabase
      .from("meal_templates")
      .select("id, name, meal_slot, notes, meal_template_items(id, grams, bases(name, category))")
      .eq("patient_id", profile.id)
      .eq("active", true)
      .order("meal_slot")
      .order("name"),
  ]);

  const nutritionist = (link as unknown as { nutritionist: { full_name: string | null } | null } | null)
    ?.nutritionist?.full_name;
  const templates = (data ?? []) as unknown as Template[];
  const order = (c: string) => BASE_CATEGORIES.findIndex((x) => x.value === c);

  // Prezzo di ogni pasto tipo in ogni gastronomia attiva: lo calcola il database (meal_price_cents).
  const { data: kitchens } = await supabase.from("kitchens").select("id, name").eq("active", true).order("name");
  const prices = new Map<string, { kitchen: string; cents: number | null }[]>();
  await Promise.all(
    templates.map(async (t) => {
      const list = await Promise.all(
        (kitchens ?? []).map(async (k) => {
          const { data: cents } = await supabase.rpc("meal_price_cents", { p_template: t.id, p_kitchen: k.id });
          return { kitchen: k.name, cents: typeof cents === "number" ? cents : null };
        }),
      );
      prices.set(t.id, list);
    }),
  );

  return (
    <RoleArea profile={profile} title="La mia settimana">
      {!link ? (
        <p className="rounded-lg bg-muted p-4 text-sm">
          Non sei ancora collegato a un nutrizionista. Chiedigli il link d&apos;invito di NutriLife.
        </p>
      ) : (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 className="text-xl font-extrabold">I tuoi pasti tipo</h2>
            <p className="text-sm text-muted-foreground">Preparati da {nutritionist ?? "il tuo nutrizionista"}</p>
          </div>
          {templates.length === 0 && (
            <p className="rounded-lg bg-muted p-4 text-sm">
              Il tuo nutrizionista non ha ancora preparato i pasti tipo.
            </p>
          )}
          {templates.map((t) => (
            <article key={t.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-heading text-lg font-extrabold">{t.name}</h3>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {SLOT_LABEL[t.meal_slot]}
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {[...t.meal_template_items]
                  .sort((a, b) => order(a.bases?.category ?? "") - order(b.bases?.category ?? ""))
                  .map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 text-sm">
                      <span>{i.bases?.name}</span>
                      <span className="tabular-nums text-muted-foreground">{i.grams} g</span>
                    </li>
                  ))}
              </ul>
              {t.notes && <p className="text-xs text-muted-foreground">Note: {t.notes}</p>}
              {(prices.get(t.id) ?? []).length > 0 && (
                <ul className="mt-1 flex flex-col gap-1 border-t pt-2">
                  {(prices.get(t.id) ?? []).map((p) => (
                    <li key={p.kitchen} className="flex justify-between gap-3 text-sm">
                      <span>{p.kitchen}</span>
                      {p.cents != null ? (
                        <span className="font-medium tabular-nums text-primary">{formatEuro(p.cents)}</span>
                      ) : (
                        <span className="text-muted-foreground">non disponibile</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}
      <ComingSoon items={["Calendario per scegliere i giorni", "Ordina entro le 18:00 del giorno prima, paghi al ritiro"]} />
    </RoleArea>
  );
}
