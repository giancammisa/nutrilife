import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { RoleArea } from "@/components/role-area";
import { MealBlob } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { allergenName, BASE_CATEGORIES, categoryLabel } from "@/lib/allergens";
import { addDays, formatDay } from "@/lib/dates";
import { getKitchenContext, getKitchenOrders, type KitchenOrder } from "@/lib/kitchen";
import { formatEuro } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { setOrderStatus } from "./actions";

export const metadata = { title: "Cucina · NutriLife" };

const SLOT_LABEL = { pranzo: "Pranzo", cena: "Cena" } as const;
const STATUS = {
  confermato: { label: "Da preparare", cls: "bg-warning/15" },
  pronto: { label: "Pronto", cls: "bg-primary/10 text-primary" },
  ritirato: { label: "Ritirato", cls: "bg-muted text-muted-foreground" },
  annullato: { label: "Annullato", cls: "bg-destructive/10 text-destructive" },
} as const;

const kgFmt = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StatusButton({ order, status, label, variant = "default" }: {
  order: KitchenOrder;
  status: "confermato" | "pronto" | "ritirato";
  label: string;
  variant?: "default" | "outline" | "ghost";
}) {
  return (
    <form action={setOrderStatus}>
      <input type="hidden" name="order_id" value={order.id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="sm" variant={variant} className="rounded-full">
        {label}
      </Button>
    </form>
  );
}

export default async function CucinaPage({ searchParams }: PageProps<"/cucina">) {
  const ctx = await getKitchenContext(await searchParams);

  if (!ctx.kitchen) {
    return (
      <RoleArea profile={ctx.profile} title="Cucina">
        <p className="rounded-lg bg-muted p-4 text-sm">
          Non sei ancora collegato a una gastronomia. Chiedi all&apos;admin di NutriLife di collegarti.
        </p>
      </RoleArea>
    );
  }

  const { profile, kitchen, kitchens, day, today, tomorrow } = ctx;
  const orders = await getKitchenOrders(kitchen.id, day);
  const q = (d: string) => `/cucina?cucina=${kitchen.id}&giorno=${d}`;

  // Riepilogo di produzione: grammi totali per base (ordini non annullati).
  const production = new Map<string, { name: string; category: string; grams: number; portions: number }>();
  for (const o of orders) {
    for (const i of o.order_items) {
      const row = production.get(i.base_name) ?? { name: i.base_name, category: i.category, grams: 0, portions: 0 };
      row.grams += i.grams;
      row.portions += 1;
      production.set(i.base_name, row);
    }
  }
  const catOrder = (c: string) => BASE_CATEGORIES.findIndex((x) => x.value === c);
  const productionRows = [...production.values()].sort(
    (a, b) => catOrder(a.category) - catOrder(b.category) || a.name.localeCompare(b.name, "it"),
  );
  const toPrepare = orders.filter((o) => o.status === "confermato").length;
  const total = orders.reduce((s, o) => s + o.price_cents, 0);
  const label = day === today ? "oggi" : day === tomorrow ? "domani" : formatDay(day);

  return (
    <RoleArea profile={profile} title={`Ordini di ${label}`}>
      <div className="flex flex-col gap-3">
        {kitchens.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {kitchens.map((k) => (
              <Button key={k.id} asChild size="sm" variant={k.id === kitchen.id ? "default" : "outline"} className="rounded-full">
                <Link href={`/cucina?cucina=${k.id}&giorno=${day}`}>{k.name}</Link>
              </Button>
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {kitchen.name} · {formatDay(day)}
        </p>
        <nav className="flex items-center gap-2" aria-label="Giorno">
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link href={q(addDays(day, -1))} aria-label="Giorno precedente"><ArrowLeft className="size-4" aria-hidden /></Link>
          </Button>
          <Button asChild size="sm" variant={day === today ? "default" : "outline"} className="rounded-full">
            <Link href={q(today)}>Oggi</Link>
          </Button>
          <Button asChild size="sm" variant={day === tomorrow ? "default" : "outline"} className="rounded-full">
            <Link href={q(tomorrow)}>Domani</Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link href={q(addDays(day, 1))} aria-label="Giorno successivo"><ArrowRight className="size-4" aria-hidden /></Link>
          </Button>
        </nav>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-lg bg-muted p-4 text-sm">Nessun ordine per {label}.</p>
      ) : (
        <>
          <section className="flex flex-col gap-4 rounded-[28px] bg-lemon p-5 text-ink">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl">Da preparare</h2>
              <span className="text-sm font-medium">
                {orders.length} {orders.length === 1 ? "pasto" : "pasti"} · {formatEuro(total)}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase text-ink/70">
                  <th className="pb-2 font-normal">Base</th>
                  <th className="pb-2 text-right font-normal">Porzioni</th>
                  <th className="pb-2 text-right font-normal">Totale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/15">
                {productionRows.map((r) => (
                  <tr key={r.name}>
                    <td className="py-2">
                      <span className="font-medium">{r.name}</span>
                      <span className="block text-xs text-ink/70">{categoryLabel(r.category)}</span>
                    </td>
                    <td className="py-2 text-right num">{r.portions}</td>
                    <td className="py-2 text-right"><span className="display text-2xl">{kgFmt.format(r.grams / 1000)}</span> <span className="text-xs font-semibold">kg</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button asChild className="h-11 bg-ink text-paper hover:bg-ink/85">
              <Link href={`/cucina/etichette?cucina=${kitchen.id}&giorno=${day}`} target="_blank">
                Stampa le etichette ({orders.length})
              </Link>
            </Button>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl">Ordini</h2>
              {toPrepare > 0 && <span className="text-sm text-muted-foreground">{toPrepare} da preparare</span>}
            </div>
            {orders.map((o) => (
              <article key={o.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold">{o.client_name ?? "Cliente"}</span>
                    <span className="text-sm text-muted-foreground">
                      {SLOT_LABEL[o.meal_slot]} · {o.template_name}
                    </span>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS[o.status].cls)}>
                    {STATUS[o.status].label}
                  </span>
                </div>
                <MealBlob items={o.order_items.map((i) => ({ category: i.category, grams: i.grams }))} size={36} />
                <ul className="flex flex-col gap-0.5 text-sm">
                  {[...o.order_items]
                    .sort((a, b) => catOrder(a.category) - catOrder(b.category))
                    .map((i) => (
                      <li key={i.id} className="flex justify-between gap-3">
                        <span>{i.base_name}</span>
                        <span className="num">{i.grams} g</span>
                      </li>
                    ))}
                </ul>
                {o.allergens.length > 0 && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Allergeni: </span>
                    <strong>{o.allergens.map(allergenName).join(", ")}</strong>
                  </p>
                )}
                {o.allergens_unverified && (
                  <p className="rounded bg-warning/15 px-2 py-1 text-xs">
                    Allergeni non verificati: il cliente ha confermato che li verificherà con voi.
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {o.status === "confermato" && (
                    <>
                      <StatusButton order={o} status="pronto" label="Segna pronto" />
                      <StatusButton order={o} status="ritirato" label="Ritirato" variant="outline" />
                    </>
                  )}
                  {o.status === "pronto" && (
                    <>
                      <StatusButton order={o} status="ritirato" label="Segna ritirato" />
                      <StatusButton order={o} status="confermato" label="Annulla “pronto”" variant="ghost" />
                    </>
                  )}
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </RoleArea>
  );
}
