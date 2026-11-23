import { pickupCode } from "@/lib/pickup";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { allergenName, BASE_CATEGORIES } from "@/lib/allergens";
import { LogoMark, MealBlob } from "@/components/brand";
import { formatDay } from "@/lib/dates";
import { getKitchenContext, getKitchenOrders } from "@/lib/kitchen";
import { PrintButton } from "./print-button";

export const metadata = { title: "Etichette · NutriLife" };

const SLOT_LABEL = { pranzo: "Pranzo", cena: "Cena" } as const;

// Pagina da stampare: un'etichetta per ordine (nome, giorno, pasto, basi con grammi, allergeni).
export default async function EtichettePage({ searchParams }: PageProps<"/cucina/etichette">) {
  const ctx = await getKitchenContext(await searchParams);
  if (!ctx.kitchen) {
    return <p className="p-6">Non sei collegato a una gastronomia.</p>;
  }

  const { kitchen, day } = ctx;
  const orders = await getKitchenOrders(kitchen.id, day);
  const catOrder = (c: string) => BASE_CATEGORIES.findIndex((x) => x.value === c);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 print:max-w-none print:p-0">
      <div className="flex flex-col gap-3 print:hidden">
        <Link href={`/cucina?cucina=${kitchen.id}&giorno=${day}`} className="inline-flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft className="size-4" aria-hidden />
          Torna agli ordini
        </Link>
        <h1 className="text-3xl">Etichette · {formatDay(day)}</h1>
        <p className="text-muted-foreground">
          {kitchen.name} · {orders.length} {orders.length === 1 ? "etichetta" : "etichette"}. Nella
          finestra di stampa scegli la tua stampante e “Margini: nessuno” se usi fogli adesivi.
        </p>
        {orders.length > 0 && <PrintButton />}
      </div>

      {orders.length === 0 && <p className="rounded-lg bg-muted p-4 text-sm">Nessun ordine per questo giorno.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-2">
        {orders.map((o) => (
          <article
            key={o.id}
            className="flex break-inside-avoid flex-col gap-2 rounded-lg border-2 border-dashed border-foreground/30 bg-white p-4 text-black print:rounded-none print:border-black"
          >
            <div className="flex items-baseline justify-between gap-2 border-b border-black/20 pb-1">
              <span className="text-lg font-semibold">{o.client_name ?? "Cliente"}</span>
              <span className="flex items-baseline gap-2">
                <span className="text-xs font-medium uppercase">{SLOT_LABEL[o.meal_slot]}</span>
                <span className="text-base font-bold tabular-nums">#{pickupCode(o.id)}</span>
              </span>
            </div>
            <p className="text-xs">
              {formatDay(o.pickup_date)} · {o.template_name}
            </p>
            <ul className="flex flex-col text-sm">
              {[...o.order_items]
                .sort((a, b) => catOrder(a.category) - catOrder(b.category))
                .map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>{i.base_name}</span>
                    <span className="font-bold tabular-nums">{i.grams} g</span>
                  </li>
                ))}
            </ul>
            <p className="text-xs">
              <span className="font-bold uppercase">Allergeni: </span>
              {o.allergens.length > 0 ? (
                <strong className="uppercase">{o.allergens.map(allergenName).join(", ")}</strong>
              ) : o.allergens_unverified ? (
                "da verificare con la gastronomia"
              ) : (
                "nessuno"
              )}
              {o.allergens.length > 0 && o.allergens_unverified && " (alcune basi da verificare)"}
            </p>
            <div className="mt-auto flex items-end justify-between gap-2 pt-1">
              <MealBlob items={o.order_items.map((i) => ({ category: i.category, grams: i.grams }))} size={22} />
              <span className="inline-flex items-center gap-1 text-[10px] text-black/60">
                <LogoMark className="size-3" title="" />
                {kitchen.name} · NutriLife
              </span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
