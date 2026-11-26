import { ArrowRight, Flame, Ticket } from "lucide-react";
import { pickupCode } from "@/lib/pickup";
import Link from "next/link";
import { RoleArea } from "@/components/role-area";
import { Button } from "@/components/ui/button";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { requireProfile } from "@/lib/auth";
import { allergenName, BASE_CATEGORIES } from "@/lib/allergens";
import { FoodPhoto } from "@/components/food-art";
import { MealBlob } from "@/components/brand";
import { DayArc, type ArcDay } from "./day-arc";
import { setShareOrders } from "./actions";
import { addDays, DATE_RE, formatCutoff, formatDay, isOrderOpen, romeToday } from "@/lib/dates";

const weekdayLongFmt = new Intl.DateTimeFormat("it-IT", { weekday: "long", timeZone: "UTC" });
const weekdayShortFmt = new Intl.DateTimeFormat("it-IT", { weekday: "short", timeZone: "UTC" });
const weekdayLong = (d: string) => {
  const w = weekdayLongFmt.format(new Date(`${d}T12:00:00Z`));
  return w.charAt(0).toUpperCase() + w.slice(1);
};
const weekdayShort = (d: string) => weekdayShortFmt.format(new Date(`${d}T12:00:00Z`)).replace(".", "");
import { formatEuro } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "La mia settimana · NutriLife" };

type Template = {
  id: string;
  name: string;
  meal_slot: "pranzo" | "cena";
  notes: string | null;
  nutritionist_id: string | null;
  meal_template_items: { id: string; grams: number; choice_group: number | null; bases: { name: string; category: string } | null }[];
};

type Order = {
  id: string;
  pickup_date: string;
  meal_slot: "pranzo" | "cena";
  template_name: string;
  price_cents: number;
  status: "confermato" | "pronto" | "ritirato" | "annullato";
  basket_id: string;
  kitchens: { name: string } | null;
};

const SLOT_LABEL = { pranzo: "Pranzo", cena: "Cena" } as const;
const STATUS_LABEL = {
  confermato: "Confermato",
  pronto: "Pronto da ritirare",
  ritirato: "Ritirato",
  annullato: "Annullato",
} as const;

export default async function ClientePage({ searchParams }: PageProps<"/cliente">) {
  const profile = await requireProfile(["cliente"]);
  const supabase = await createClient();
  const { ordinato } = await searchParams;

  const today = romeToday();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const [{ data: link }, { data: tplData }, { data: settings }, { data: ordersData }, { data: me }] =
    await Promise.all([
      supabase
        .from("nutritionist_patients")
        .select("nutritionist:profiles!nutritionist_patients_nutritionist_id_fkey(full_name)")
        .eq("patient_id", profile.id)
        .maybeSingle(),
      supabase
        .from("meal_templates")
        .select("id, name, meal_slot, notes, nutritionist_id, meal_template_items(id, grams, choice_group, bases(name, category))")
        .eq("patient_id", profile.id)
        // solo i piatti composti dal cliente (i pasti tipo del nutrizionista sono messi da parte)
        .is("nutritionist_id", null)
        .eq("active", true)
        .order("meal_slot")
        .order("name"),
      supabase.from("app_settings").select("cutoff_hour").maybeSingle(),
      supabase
        .from("orders")
        .select("id, pickup_date, meal_slot, template_name, price_cents, status, basket_id, kitchens(name)")
        .eq("client_id", profile.id)
        .neq("status", "annullato")
        .gte("pickup_date", days[0])
        .lte("pickup_date", days[days.length - 1])
        .order("meal_slot"),
      supabase.from("profiles").select("allergies, intolerances").eq("id", profile.id).single(),
    ]);

  const cutoffHour = settings?.cutoff_hour ?? 18;
  const nutritionist = (link as unknown as { nutritionist: { full_name: string | null } | null } | null)
    ?.nutritionist?.full_name;
  const templates = (tplData ?? []) as unknown as Template[];
  const orders = (ordersData ?? []) as unknown as Order[];
  const order = (c: string) => BASE_CATEGORIES.findIndex((x) => x.value === c);
  const myAllergies: string[] = [...(me?.allergies ?? []), ...(me?.intolerances ?? [])];
  // Si ordina con i propri piatti (serve almeno una base)
  const canOrder = templates.some((t) => t.meal_template_items.length > 0);
  const justOrdered = typeof ordinato === "string" && DATE_RE.test(ordinato) ? ordinato : null;

  // Momenti (pranzo/cena) per cui c'è un pasto tipo: il giorno è "pieno" se li ha già ordinati tutti.
  const slotsWithTemplates = [...new Set(templates.map((t) => t.meal_slot))];
  const tomorrow = addDays(today, 1);
  const arcDays: ArcDay[] = days.map((day) => {
    const open = isOrderOpen(day, cutoffHour);
    return {
      date: day,
      label: day === today ? "Oggi" : day === tomorrow ? "Domani" : weekdayLong(day),
      weekday: weekdayShort(day),
      dayNum: String(Number(day.slice(8, 10))),
      title: day === today ? `Oggi, ${formatDay(day)}` : day === tomorrow ? `Domani, ${formatDay(day)}` : formatDay(day),
      note: open ? `Ordini ${formatCutoff(day, cutoffHour)}` : "Ordini chiusi",
      ordered: orders.some((o) => o.pickup_date === day),
      open,
    };
  });
  const panels = days.map((day) => {
    const dayOrders = orders.filter((o) => o.pickup_date === day);
    const open = isOrderOpen(day, cutoffHour);
    const full = slotsWithTemplates.every((s) => dayOrders.some((o) => o.meal_slot === s));
    return (
      <div key={day} className="flex flex-col gap-3">
        {dayOrders.map((o) => (
          <div key={o.id} className="flex flex-col gap-2 rounded-[22px] bg-grad-lime p-4 text-sm text-ink">
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-col">
                <span className="font-semibold">
                  {SLOT_LABEL[o.meal_slot]} · {o.template_name}
                </span>
                <span className="text-ink/70">
                  {o.kitchens?.name ?? "Gastronomia"} · {STATUS_LABEL[o.status]}
                  {orders.filter((x) => x.basket_id === o.basket_id).length > 1 &&
                    ` · parte di un pasto in ${orders.filter((x) => x.basket_id === o.basket_id).length} punti`}
                </span>
              </span>
              <span className="num">{formatEuro(o.price_cents)}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/cliente/ritiro/${o.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-ink pr-4 pl-3 text-sm font-semibold text-paper transition-colors hover:bg-ink/85"
              >
                <Ticket className="size-4" aria-hidden />
                Mostra al ritiro
                <span className="num text-lemon">#{pickupCode(o.id)}</span>
              </Link>
              {open && o.status === "confermato" && (
                <CancelOrderButton
                  orderId={o.id}
                  parts={orders.filter((x) => x.basket_id === o.basket_id).length}
                  label={`il ${SLOT_LABEL[o.meal_slot].toLowerCase()} di ${day === tomorrow ? "domani" : formatDay(day)}`}
                />
              )}
            </div>
          </div>
        ))}
        {open && canOrder && !full && (
          <Button asChild variant={dayOrders.length ? "outline" : "default"} className="h-12 rounded-full text-base">
            <Link href={`/cliente/ordina?giorno=${day}`}>
              {dayOrders.length ? "Ordina un altro pasto" : "Ordina"}
            </Link>
          </Button>
        )}
        {!open && dayOrders.length === 0 && <p className="text-sm text-muted-foreground">Nessun ordine.</p>}
        {open && !canOrder && dayOrders.length === 0 && (
          <p className="text-sm text-muted-foreground">Potrai ordinare quando i tuoi pasti tipo saranno pronti.</p>
        )}
      </div>
    );
  });
  const initialDay = Math.max(0, justOrdered ? days.indexOf(justOrdered) : 0);

  return (
    <RoleArea profile={profile} title="La mia settimana">
      {justOrdered && (
        <p role="status" className="rounded-lg bg-primary/10 p-4 text-primary">
          Ordine confermato per <strong>{formatDay(justOrdered)}</strong>. Paghi al ritiro in gastronomia.
        </p>
      )}

      {templates.length === 0 && (
        <p className="rounded-[20px] bg-muted p-4 text-sm">
          Componi il tuo primo piatto pesato in &quot;I miei piatti&quot;: scegli le basi e i grammi, poi ordinalo.
        </p>
      )}

      <DayArc days={arcDays} panels={panels} initial={initialDay} />

      {link && (
        <form
          action={setShareOrders}
          className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm"
        >
          <input type="hidden" name="share" value={profile.share_orders ? "false" : "true"} />
          <span className="flex flex-col">
            <span className="font-medium">Condividi i miei ordini con {nutritionist ?? "il mio nutrizionista"}</span>
            <span className="text-muted-foreground">
              {profile.share_orders
                ? "Attivo: vede i pasti ritirati degli ultimi 90 giorni, per valutare il Gold."
                : "Spento: non vede i tuoi ordini. Attivalo per ricevere il Gold al controllo."}
            </span>
          </span>
          <Button type="submit" variant={profile.share_orders ? "outline" : "default"} size="sm" className="shrink-0 rounded-full">
            {profile.share_orders ? "Spegni" : "Attiva"}
          </Button>
        </form>
      )}
      <Link
        href="/cliente/allergie"
        className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm transition-colors hover:border-primary"
      >
        <span className="flex flex-col">
          <span className="font-medium">Le mie allergie</span>
          <span className="text-muted-foreground">
            {myAllergies.length === 0 ? "Nessuna indicata" : myAllergies.map(allergenName).join(", ")}
          </span>
        </span>
        <ArrowRight aria-hidden className="size-5 shrink-0" />
      </Link>
      <Link
        href="/cliente/premi"
        className="flex items-center justify-between gap-3 rounded-[24px] bg-ink p-4 text-sm text-paper transition-colors hover:bg-ink/90"
      >
        <span className="flex flex-col">
          <span className="font-semibold">I miei progressi</span>
          <span className="text-paper/70">Serie, traguardi e card da condividere</span>
        </span>
        <Flame aria-hidden className="size-5 shrink-0 text-lemon" />
      </Link>
      <Link
        href="/cliente/piatti"
        className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm transition-colors hover:border-primary"
      >
        <span className="flex flex-col">
          <span className="font-medium">I miei piatti</span>
          <span className="text-muted-foreground">Componi i tuoi piatti pesati</span>
        </span>
        <ArrowRight aria-hidden className="size-5 shrink-0" />
      </Link>
      <Link
        href="/cliente/ordini"
        className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm transition-colors hover:border-primary"
      >
        <span className="font-medium">I miei ordini</span>
        <ArrowRight aria-hidden className="size-5 shrink-0" />
      </Link>


      {templates.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 className="section-title">I tuoi piatti</h2>
            <p className="text-sm text-muted-foreground">
              {nutritionist ? `Il Gold lo assegna ${nutritionist} dopo il controllo` : "Composti da te"}
            </p>
          </div>
          {templates.map((t, idx) => (
            <article
              key={t.id}
              className={`${idx % 2 ? "bg-grad-fog" : "bg-grad-leaf"} relative flex flex-col gap-3 overflow-hidden rounded-[28px] p-5 text-ink [&_.text-muted-foreground]:text-ink/65 [&>:not(img)]:relative`}
            >
              <FoodPhoto
                name={idx % 2 ? "fico" : "uva-verde"}
                sizes="200px"
                className="absolute inset-y-0 right-0 h-full w-48 object-cover opacity-45 [mask-image:linear-gradient(to_left,black_30%,transparent)]"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <h3 className="card-title">{t.name}</h3>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {SLOT_LABEL[t.meal_slot]}
                  </span>
                </div>
                <MealBlob
                  items={t.meal_template_items
                    .filter((i, idx, all) => i.choice_group == null || all.findIndex((x) => x.choice_group === i.choice_group) === idx)
                    .map((i) => ({ category: i.bases?.category ?? "altro", grams: i.grams }))}
                  size={44}
                  outline="var(--ink)"
                />
              </div>
              <ul className="flex flex-col gap-1">
                {[...t.meal_template_items]
                  .sort(
                    (a, b) =>
                      order(a.bases?.category ?? "") - order(b.bases?.category ?? "") ||
                      (a.choice_group ?? 0) - (b.choice_group ?? 0),
                  )
                  .map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 text-sm">
                      <span>
                        {i.bases?.name}
                        {i.choice_group != null &&
                          t.meal_template_items.filter((x) => x.choice_group === i.choice_group).length > 1 && (
                            <span className="ml-2 text-xs text-muted-foreground">a scelta</span>
                          )}
                      </span>
                      <span className="num">{i.grams} g</span>
                    </li>
                  ))}
              </ul>
              {t.notes && <p className="text-xs text-muted-foreground">Note: {t.notes}</p>}
            </article>
          ))}
        </section>
      )}
    </RoleArea>
  );
}
