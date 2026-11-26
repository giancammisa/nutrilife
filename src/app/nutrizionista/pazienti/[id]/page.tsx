import { notFound } from "next/navigation";
import { Award, Lock } from "lucide-react";
import { RoleArea } from "@/components/role-area";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { BASE_CATEGORIES, categoryLabel } from "@/lib/allergens";
import { formatDay } from "@/lib/dates";
import { WEEK_TARGET, weekStart } from "@/lib/rewards";
import { createClient } from "@/lib/supabase/server";
import { awardGold, removeGold } from "../../actions";

export const metadata = { title: "Paziente · NutriLife" };

// Il nutrizionista non prepara più i pasti: al controllo guarda come ha ordinato il paziente
// (solo se lui ha acconsentito) e assegna il Gold. I pasti tipo sono messi da parte (codice conservato).

type Row = { date: string; slot: "pranzo" | "cena"; basket: string; base: string; category: string; grams: number };
type Summary = { shared: boolean; rows: Row[] } | null;

const SLOT_LABEL = { pranzo: "Pranzo", cena: "Cena" } as const;
const DAYS = 90;

export default async function PazientePage({ params }: PageProps<"/nutrizionista/pazienti/[id]">) {
  const profile = await requireProfile(["nutrizionista"]);
  const { id: patientId } = await params;
  const supabase = await createClient();

  const [{ data: link }, { data: summaryData, error: summaryError }, { data: goldData }] = await Promise.all([
    supabase
      .from("nutritionist_patients")
      .select("patient:profiles!nutritionist_patients_patient_id_fkey(full_name, email)")
      .eq("nutritionist_id", profile.id)
      .eq("patient_id", patientId)
      .maybeSingle(),
    supabase.rpc("patient_orders", { p_patient: patientId }),
    supabase
      .from("gold_awards")
      .select("id, awarded_on, nutritionist_id")
      .eq("client_id", patientId)
      .order("awarded_on", { ascending: false }),
  ]);

  // Solo i propri pazienti: per gli altri la pagina non esiste.
  if (!link) notFound();
  const patient = (link as unknown as { patient: { full_name: string | null; email: string | null } | null })
    .patient;
  const name = patient?.full_name || patient?.email || "Il paziente";
  const summary = (summaryError ? null : summaryData) as Summary;
  const golds = (goldData ?? []) as { id: string; awarded_on: string; nutritionist_id: string | null }[];
  const rows = summary?.rows ?? [];

  // Un pasto = un carrello (anche se diviso tra più punti vendita)
  const meals = new Map<string, { date: string; slot: Row["slot"]; items: Row[] }>();
  for (const r of rows) {
    const m = meals.get(r.basket) ?? { date: r.date, slot: r.slot, items: [] };
    m.items.push(r);
    meals.set(r.basket, m);
  }
  const list = [...meals.values()].sort((a, b) => b.date.localeCompare(a.date) || a.slot.localeCompare(b.slot));

  const perWeek = new Map<string, number>();
  for (const m of list) perWeek.set(weekStart(m.date), (perWeek.get(weekStart(m.date)) ?? 0) + 1);
  const weeksDone = [...perWeek.values()].filter((n) => n >= WEEK_TARGET).length;

  // Grammi medi per pasto, per categoria
  const avg = BASE_CATEGORIES.map((c) => ({
    label: categoryLabel(c.value),
    grams: list.length
      ? Math.round(rows.filter((r) => r.category === c.value).reduce((s, r) => s + r.grams, 0) / list.length)
      : 0,
  })).filter((x) => x.grams > 0);

  // Basi ordinate più spesso
  const freq = new Map<string, number>();
  for (const r of rows) freq.set(r.base, (freq.get(r.base) ?? 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <RoleArea profile={profile} title={name} back={{ href: "/nutrizionista", label: "I tuoi pazienti" }}>
      <p className="text-muted-foreground">
        Al controllo guarda come ha ordinato negli ultimi {DAYS} giorni e, se l&apos;andamento ti convince, assegna il
        Gold. Il paziente lo vede nei suoi progressi e può condividerlo.
      </p>

      <section className="flex flex-col gap-4 rounded-[28px] border bg-card p-5">
        <h2 className="section-title">Ordini degli ultimi {DAYS} giorni</h2>

        {!summary ? (
          <p className="text-sm text-muted-foreground">Riepilogo non disponibile in questo momento.</p>
        ) : !summary.shared ? (
          <p className="flex items-start gap-3 rounded-[20px] bg-muted p-4 text-sm">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {name} non ha ancora condiviso i suoi ordini con te. Può attivarlo dalla sua app, in &quot;La mia
              settimana&quot;.
            </span>
          </p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun pasto ritirato negli ultimi {DAYS} giorni.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 rounded-[20px] bg-grad-lime p-4 text-ink">
                <span className="display text-4xl">{list.length}</span>
                <span className="text-sm font-semibold">pasti ritirati</span>
              </div>
              <div className="flex flex-col gap-1 rounded-[20px] bg-grad-leaf p-4 text-ink">
                <span className="display text-4xl">{weeksDone}</span>
                <span className="text-sm font-semibold">settimane con {WEEK_TARGET}+ pasti</span>
              </div>
            </div>

            {avg.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="card-title">In media per pasto</h3>
                <ul className="flex flex-col gap-1">
                  {avg.map((a) => (
                    <li key={a.label} className="flex justify-between gap-3 text-sm">
                      <span>{a.label}</span>
                      <span className="num">{a.grams} g</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <h3 className="card-title">Basi più ordinate</h3>
              <ul className="flex flex-wrap gap-2">
                {top.map(([base, n]) => (
                  <li key={base} className="rounded-full border bg-white/70 px-3 py-1 text-sm">
                    {base} <span className="num text-muted-foreground">×{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="card-title">Ultimi pasti</h3>
              <ul className="flex flex-col divide-y">
                {list.slice(0, 12).map((m, i) => (
                  <li key={i} className="flex flex-col gap-1 py-3">
                    <span className="text-sm font-semibold">
                      {formatDay(m.date)} · {SLOT_LABEL[m.slot]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {m.items.map((it) => `${it.base} ${it.grams} g`).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-[28px] bg-ink p-5 text-paper">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-lemon text-ink">
            <Award className="size-5" aria-hidden />
          </span>
          <h2 className="section-title">Gold</h2>
        </div>
        <p className="text-sm text-paper/75">
          Assegnalo dopo il controllo, quando gli obiettivi concordati sono raggiunti. Non contiene note né dati
          sanitari: solo la data e il tuo nome.
        </p>
        {golds.length > 0 && (
          <ul className="flex flex-col gap-2">
            {golds.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-white/10 px-4 py-2 text-sm">
                <span>Gold del {formatDay(g.awarded_on)}</span>
                {g.nutritionist_id === profile.id && (
                  <form action={removeGold}>
                    <input type="hidden" name="gold_id" value={g.id} />
                    <input type="hidden" name="patient_id" value={patientId} />
                    <Button type="submit" variant="ghost" size="sm" className="text-paper hover:bg-white/10 hover:text-paper">
                      Togli
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <form action={awardGold}>
          <input type="hidden" name="patient_id" value={patientId} />
          <Button type="submit" className="h-12 w-full rounded-full bg-lemon text-base text-ink hover:bg-lemon/90">
            <Award aria-hidden /> Assegna il Gold
          </Button>
        </form>
      </section>
    </RoleArea>
  );
}
