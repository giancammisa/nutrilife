import { notFound } from "next/navigation";
import { RoleArea } from "@/components/role-area";
import { MealBlob, MealLegend } from "@/components/brand";
import { ActionForm } from "@/components/action-form";
import { BasePicker } from "@/components/base-picker";
import { DietPlanImport } from "./diet-plan-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth";
import { BASE_CATEGORIES, categoryLabel } from "@/lib/allergens";
import { createClient } from "@/lib/supabase/server";
import {
  addTemplateItem,
  createTemplate,
  removeTemplateItem,
  setTemplateActive,
  updateItemGrams,
} from "../../actions";

export const metadata = { title: "Paziente · NutriLife" };
// La lettura del piano con l'AI può richiedere fino a un minuto.
export const maxDuration = 120;

type Template = {
  id: string;
  name: string;
  meal_slot: "pranzo" | "cena";
  notes: string | null;
  active: boolean;
  meal_template_items: {
    id: string;
    grams: number;
    choice_group: number | null;
    bases: { id: string; name: string; category: string } | null;
  }[];
};

const SLOT_LABEL = { pranzo: "Pranzo", cena: "Cena" } as const;

export default async function PazientePage({ params }: PageProps<"/nutrizionista/pazienti/[id]">) {
  const profile = await requireProfile(["nutrizionista"]);
  const { id: patientId } = await params;
  const supabase = await createClient();

  const [{ data: link }, { data: templatesData }, { data: bases }] = await Promise.all([
    supabase
      .from("nutritionist_patients")
      .select("patient:profiles!nutritionist_patients_patient_id_fkey(full_name, email)")
      .eq("nutritionist_id", profile.id)
      .eq("patient_id", patientId)
      .maybeSingle(),
    supabase
      .from("meal_templates")
      .select("id, name, meal_slot, notes, active, meal_template_items(id, grams, choice_group, bases(id, name, category))")
      .eq("patient_id", patientId)
      // solo i pasti preparati da questo nutrizionista (non i piatti composti dal paziente)
      .eq("nutritionist_id", profile.id)
      .order("meal_slot")
      .order("name"),
    supabase.from("bases").select("id, name, category").eq("active", true).order("name"),
  ]);

  // Solo i propri pazienti: per gli altri la pagina non esiste.
  if (!link) notFound();
  const patient = (link as unknown as { patient: { full_name: string | null; email: string | null } | null })
    .patient;

  const templates = (templatesData ?? []) as unknown as Template[];
  const active = templates.filter((t) => t.active);
  const inactive = templates.filter((t) => !t.active);

  return (
    <RoleArea
      profile={profile}
      title={patient?.full_name || patient?.email || "Paziente"}
      back={{ href: "/nutrizionista", label: "I tuoi pazienti" }}
    >
      <p className="text-muted-foreground">
        Prepara 3-4 pasti tipo con basi e grammature. Il paziente sceglierà quale farsi preparare
        ogni giorno.
      </p>

      {active.length === 0 && (
        <p className="rounded-lg bg-muted p-4 text-sm">Nessun pasto tipo. Creane uno qui sotto.</p>
      )}

      {active.map((t) => (
        <TemplateCard key={t.id} template={t} patientId={patientId} bases={bases ?? []} />
      ))}

      <DietPlanImport patientId={patientId} bases={bases ?? []} />

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <h2 className="section-title">Nuovo pasto tipo</h2>
        <ActionForm action={createTemplate} submitLabel="Crea pasto tipo" resetOnSuccess>
          <input type="hidden" name="patient_id" value={patientId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required maxLength={60} placeholder="Pranzo A" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="meal_slot">Momento</Label>
            <select
              id="meal_slot"
              name="meal_slot"
              required
              defaultValue="pranzo"
              className="h-11 rounded-lg border border-input bg-background px-3 text-base"
            >
              <option value="pranzo">Pranzo</option>
              <option value="cena">Cena</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Note per la cucina (facoltative)</Label>
            <Input id="notes" name="notes" maxLength={300} placeholder="Es. senza sale aggiunto" />
          </div>
        </ActionForm>
      </section>

      {inactive.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="section-title">Pasti tipo archiviati</h2>
          {inactive.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-sm">
              <span>
                {t.name} · {SLOT_LABEL[t.meal_slot]}
              </span>
              <form action={setTemplateActive}>
                <input type="hidden" name="template_id" value={t.id} />
                <input type="hidden" name="patient_id" value={patientId} />
                <input type="hidden" name="active" value="true" />
                <Button type="submit" variant="ghost" size="sm">
                  Ripristina
                </Button>
              </form>
            </div>
          ))}
        </section>
      )}
    </RoleArea>
  );
}

function TemplateCard({
  template: t,
  patientId,
  bases,
}: {
  template: Template;
  patientId: string;
  bases: { id: string; name: string; category: string }[];
}) {
  const items = [...t.meal_template_items].sort((a, b) => {
    const order = (c: string) => BASE_CATEGORIES.findIndex((x) => x.value === c);
    return (
      order(a.bases?.category ?? "") - order(b.bases?.category ?? "") ||
      (a.choice_group ?? 0) - (b.choice_group ?? 0)
    );
  });
  // Per i totali e il disegno conta la prima alternativa di ogni gruppo.
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
  const total = shown.reduce((sum, i) => sum + i.grams, 0);

  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="section-title">{t.name}</h2>
          <span className="text-sm text-muted-foreground">
            {SLOT_LABEL[t.meal_slot]} · <span className="num text-foreground">{total} g</span> in tutto
          </span>
          {items.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <MealBlob items={shown.map((i) => ({ category: i.bases?.category ?? "altro", grams: i.grams }))} size={52} />
              <MealLegend />
            </div>
          )}
          {t.notes && <span className="text-sm">Note: {t.notes}</span>}
        </div>
        <form action={setTemplateActive}>
          <input type="hidden" name="template_id" value={t.id} />
          <input type="hidden" name="patient_id" value={patientId} />
          <input type="hidden" name="active" value="false" />
          <Button type="submit" variant="ghost" size="sm">
            Archivia
          </Button>
        </form>
      </div>

      {items.length === 0 && <p className="text-sm text-muted-foreground">Nessuna base. Aggiungine una.</p>}

      <ul className="flex flex-col divide-y">
        {items.map((i) => (
          <li key={i.id} className="flex flex-col gap-2 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{i.bases?.name}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {groupSize(i.choice_group) > 1 && (
                  <span className="rounded-full bg-lemon px-2 py-0.5 font-semibold text-ink">
                    a scelta · gruppo {i.choice_group}
                  </span>
                )}
                {categoryLabel(i.bases?.category ?? "")}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <ActionForm action={updateItemGrams} submitLabel="Aggiorna grammi">
                  <input type="hidden" name="item_id" value={i.id} />
                  <input type="hidden" name="patient_id" value={patientId} />
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
              </div>
            </div>
            <form action={removeTemplateItem} className="self-start">
              <input type="hidden" name="item_id" value={i.id} />
              <input type="hidden" name="patient_id" value={patientId} />
              <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                Togli {i.bases?.name}
              </Button>
            </form>
          </li>
        ))}
      </ul>

      {addable.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-4">
          <ActionForm action={addTemplateItem} submitLabel="Aggiungi base" resetOnSuccess>
            <input type="hidden" name="template_id" value={t.id} />
            <input type="hidden" name="patient_id" value={patientId} />
            <BasePicker bases={addable} />
            {items.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor={`alt-${t.id}`}>In alternativa a (facoltativo)</Label>
                <select
                  id={`alt-${t.id}`}
                  name="alt_of"
                  defaultValue=""
                  className="h-11 rounded-lg border border-input bg-white/70 px-3 text-base"
                >
                  <option value="">No, base fissa (c&apos;è sempre)</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.bases?.name} {i.grams} g
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground">
                  Se scegli una base qui, il cliente sceglierà tra le due (o più) quando ordina.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor={`grams-${t.id}`}>Grammi</Label>
              <Input
                id={`grams-${t.id}`}
                name="grams"
                type="number"
                inputMode="numeric"
                min={1}
                max={1000}
                required
                placeholder="150"
                className="h-11 text-base"
              />
            </div>
          </ActionForm>
        </div>
      )}
    </section>
  );
}
