import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { RoleArea } from "@/components/role-area";
import { Button } from "@/components/ui/button";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { requireProfile } from "@/lib/auth";
import { allergenName, BASE_CATEGORIES } from "@/lib/allergens";
import { MealBlob } from "@/components/brand";
import { addDays, DATE_RE, formatCutoff, formatDay, isOrderOpen, romeToday } from "@/lib/dates";
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

type Order = {
  id: string;
  pickup_date: string;
  meal_slot: "pranzo" | "cena";
  template_name: string;
  price_cents: number;
  status: "confermato" | "pronto" | "ritirato" | "annullato";
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
        .select("id, name, meal_slot, notes, meal_template_items(id, grams, bases(name, category))")
        .eq("patient_id", profile.id)
        .eq("active", true)
        .order("meal_slot")
        .order("name"),
      supabase.from("app_settings").select("cutoff_hour").maybeSingle(),
      supabase
        .from("orders")
        .select("id, pickup_date, meal_slot, template_name, price_cents, status, kitchens(name)")
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
  const canOrder = Boolean(link) && templates.length > 0;
  const justOrdered = typeof ordinato === "string" && DATE_RE.test(ordinato) ? ordinato : null;

  return (
    <RoleArea profile={profile} title="La mia settimana">
      {justOrdered && (
        <p role="status" className="rounded-lg bg-primary/10 p-4 text-primary">
          Ordine confermato per <strong>{formatDay(justOrdered)}</strong>. Paghi al ritiro in gastronomia.
        </p>
      )}

      {!link && (
        <p className="rounded-lg bg-muted p-4 text-sm">
          Non sei ancora collegato a un nutrizionista. Chiedigli il link d&apos;invito di NutriLife.
        </p>
      )}
      {link && templates.length === 0 && (
        <p className="rounded-lg bg-muted p-4 text-sm">
          {nutritionist ?? "Il tuo nutrizionista"} non ha ancora preparato i tuoi pasti tipo: quando
          saranno pronti potrai ordinare.
        </p>
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
        href="/cliente/ordini"
        className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm transition-colors hover:border-primary"
      >
        <span className="font-medium">I miei ordini</span>
        <ArrowRight aria-hidden className="size-5 shrink-0" />
      </Link>

      <section className="flex flex-col gap-3">
        {days.map((day) => {
          const dayOrders = orders.filter((o) => o.pickup_date === day);
          const open = isOrderOpen(day, cutoffHour);
          // Pieno se per ogni momento (pranzo/cena) con un pasto tipo c'è già un ordine.
          const slotsWithTemplates = [...new Set(templates.map((t) => t.meal_slot))];
          const full = slotsWithTemplates.every((s) => dayOrders.some((o) => o.meal_slot === s));
          return (
            <article key={day} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg">
                  {day === today ? "Oggi" : day === addDays(today, 1) ? "Domani" : formatDay(day)}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {open ? formatCutoff(day, cutoffHour) : "ordini chiusi"}
                </span>
              </div>

              {dayOrders.map((o) => (
                <div key={o.id} className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex flex-col">
                      <span className="font-medium">
                        {SLOT_LABEL[o.meal_slot]} · {o.template_name}
                      </span>
                      <span className="text-muted-foreground">
                        {o.kitchens?.name ?? "Gastronomia"} · {STATUS_LABEL[o.status]}
                      </span>
                    </span>
                    <span className="tabular-nums font-medium">{formatEuro(o.price_cents)}</span>
                  </div>
                  {open && o.status === "confermato" && (
                    <CancelOrderButton
                      orderId={o.id}
                      label={`il ${SLOT_LABEL[o.meal_slot].toLowerCase()} di ${day === addDays(today, 1) ? "domani" : formatDay(day)}`}
                    />
                  )}
                </div>
              ))}

              {open && canOrder && !full && (
                <Button asChild variant={dayOrders.length ? "outline" : "default"} className="h-11 rounded-full">
                  <Link href={`/cliente/ordina?giorno=${day}`}>
                    {dayOrders.length ? "Ordina un altro pasto" : "Ordina"}
                  </Link>
                </Button>
              )}
              {!open && dayOrders.length === 0 && (
                <p className="text-sm text-muted-foreground">Nessun ordine.</p>
              )}
            </article>
          );
        })}
      </section>

      {templates.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 className="text-xl">I tuoi pasti tipo</h2>
            <p className="text-sm text-muted-foreground">Preparati da {nutritionist ?? "il tuo nutrizionista"}</p>
          </div>
          {templates.map((t) => (
            <article key={t.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <h3 className="text-lg">{t.name}</h3>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {SLOT_LABEL[t.meal_slot]}
                  </span>
                </div>
                <MealBlob
                  items={t.meal_template_items.map((i) => ({ category: i.bases?.category ?? "altro", grams: i.grams }))}
                  size={44}
                />
              </div>
              <ul className="flex flex-col gap-1">
                {[...t.meal_template_items]
                  .sort((a, b) => order(a.bases?.category ?? "") - order(b.bases?.category ?? ""))
                  .map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 text-sm">
                      <span>{i.bases?.name}</span>
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
