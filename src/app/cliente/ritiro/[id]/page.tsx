import { notFound } from "next/navigation";
import { RoleArea } from "@/components/role-area";
import { MealBlob } from "@/components/brand";
import { requireProfile } from "@/lib/auth";
import { allergenName, BASE_CATEGORIES } from "@/lib/allergens";
import { addDays, formatDay, romeToday } from "@/lib/dates";
import { pickupCode, UUID_RE } from "@/lib/pickup";
import { formatEuro } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Biglietto di ritiro · NutriLife" };

type Order = {
  id: string;
  pickup_date: string;
  meal_slot: "pranzo" | "cena";
  template_name: string;
  price_cents: number;
  status: "confermato" | "pronto" | "ritirato" | "annullato";
  allergens: string[];
  allergens_unverified: boolean;
  kitchens: { name: string; address: string | null } | null;
  order_items: { id: string; base_name: string; category: string; grams: number }[];
};

const SLOT_LABEL = { pranzo: "Pranzo", cena: "Cena" } as const;
const STEPS = [
  { key: "confermato", label: "Confermato" },
  { key: "pronto", label: "Pronto" },
  { key: "ritirato", label: "Ritirato" },
] as const;

// Biglietto da mostrare al banco: codice grande, nome, giorno, cosa pagare.
export default async function RitiroPage({ params }: PageProps<"/cliente/ritiro/[id]">) {
  const profile = await requireProfile(["cliente"]);
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, pickup_date, meal_slot, template_name, price_cents, status, allergens, allergens_unverified, kitchens(name, address), order_items(id, base_name, category, grams)",
    )
    .eq("id", id)
    .eq("client_id", profile.id)
    .maybeSingle();
  if (!data) notFound();

  const o = data as unknown as Order;
  const code = pickupCode(o.id);
  const today = romeToday();
  const when =
    o.pickup_date === today ? "Oggi" : o.pickup_date === addDays(today, 1) ? "Domani" : formatDay(o.pickup_date);
  const stepIndex = STEPS.findIndex((s) => s.key === o.status);
  const catOrder = (c: string) => BASE_CATEGORIES.findIndex((x) => x.value === c);
  const cancelled = o.status === "annullato";

  return (
    <RoleArea profile={profile} title="Il tuo ritiro" back={{ href: "/cliente", label: "La mia settimana" }}>
      <section
        aria-label="Biglietto di ritiro"
        className={cn(
          "relative flex flex-col items-center gap-4 overflow-hidden rounded-[32px] p-6 text-center text-ink",
          cancelled ? "bg-grad-fog opacity-80" : "bg-grad-lime",
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/65">
          {cancelled ? "Ordine annullato" : "Mostra al banco"}
        </span>
        <p className="flex flex-col items-center">
          <span className="sr-only">Codice di ritiro</span>
          <span className="display num text-[5.5rem] leading-none tracking-[0.04em]" aria-hidden>
            #{code}
          </span>
          <span className="sr-only">{code.split("").join(" ")}</span>
        </p>
        <p className="flex flex-col">
          <span className="text-xl font-semibold">{profile.full_name ?? "Cliente"}</span>
          <span className="text-sm text-ink/70 first-letter:uppercase">
            {when} · {SLOT_LABEL[o.meal_slot]} · {o.template_name}
          </span>
        </p>

        {/* bordo strappato del biglietto */}
        <span aria-hidden className="my-1 w-full border-t-2 border-dashed border-ink/20" />

        <div className="flex w-full items-end justify-between gap-3 text-left">
          <span className="flex flex-col">
            <span className="text-sm font-semibold">{o.kitchens?.name ?? "Gastronomia"}</span>
            {o.kitchens?.address && <span className="text-xs text-ink/70">{o.kitchens.address}</span>}
          </span>
          <span className="flex flex-col items-end">
            <span className="text-xs text-ink/70">{o.status === "ritirato" ? "Totale" : "Paghi al ritiro"}</span>
            <span className="display text-4xl">{formatEuro(o.price_cents)}</span>
          </span>
        </div>
      </section>

      {!cancelled && (
        <ol className="grid grid-cols-3 gap-2" aria-label="Stato dell'ordine">
          {STEPS.map((s, i) => {
            const done = i <= stepIndex;
            return (
              <li
                key={s.key}
                aria-current={i === stepIndex ? "step" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-[20px] py-3 text-xs font-semibold",
                  done ? "bg-ink text-paper" : "bg-card text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn("size-2 rounded-full", done ? "bg-lemon" : "bg-ink/20")}
                />
                {s.label}
              </li>
            );
          })}
        </ol>
      )}

      <section className="flex flex-col gap-3 rounded-[28px] border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Nel piatto</h2>
          <MealBlob items={o.order_items.map((i) => ({ category: i.category, grams: i.grams }))} size={40} />
        </div>
        <ul className="flex flex-col gap-1 text-sm">
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
          <p className="text-xs text-muted-foreground">Allergeni: {o.allergens.map(allergenName).join(", ")}</p>
        )}
        {o.allergens_unverified && (
          <p className="text-xs text-muted-foreground">Allergeni non verificati: chiedi conferma in gastronomia.</p>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Al banco controllano codice e nome. Puoi anche fare uno screenshot di questa pagina.
      </p>
    </RoleArea>
  );
}
