import Link from "next/link";
import { Ticket } from "lucide-react";
import { RoleArea } from "@/components/role-area";
import { pickupCode } from "@/lib/pickup";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { requireProfile } from "@/lib/auth";
import { allergenName, BASE_CATEGORIES } from "@/lib/allergens";
import { MealBlob } from "@/components/brand";
import { formatDay, isOrderOpen, romeToday } from "@/lib/dates";
import { formatEuro } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "I miei ordini · NutriLife" };

type Order = {
  id: string;
  pickup_date: string;
  meal_slot: "pranzo" | "cena";
  template_name: string;
  price_cents: number;
  status: "confermato" | "pronto" | "ritirato" | "annullato";
  allergens: string[];
  intolerance_warning: string[];
  allergens_unverified: boolean;
  kitchens: { name: string } | null;
  order_items: { id: string; base_name: string; category: string; grams: number }[];
};

const SLOT_LABEL = { pranzo: "Pranzo", cena: "Cena" } as const;
const STATUS = {
  confermato: { label: "Confermato", cls: "bg-primary/10 text-primary" },
  pronto: { label: "Pronto da ritirare", cls: "bg-accent/40 text-foreground" },
  ritirato: { label: "Ritirato", cls: "bg-muted text-muted-foreground" },
  annullato: { label: "Annullato", cls: "bg-destructive/10 text-destructive" },
} as const;

export default async function OrdiniPage() {
  const profile = await requireProfile(["cliente"]);
  const supabase = await createClient();

  const [{ data }, { data: settings }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, pickup_date, meal_slot, template_name, price_cents, status, allergens, intolerance_warning, allergens_unverified, kitchens(name), order_items(id, base_name, category, grams)",
      )
      .eq("client_id", profile.id)
      .order("pickup_date", { ascending: false })
      .order("meal_slot")
      .limit(100),
    supabase.from("app_settings").select("cutoff_hour").maybeSingle(),
  ]);

  const cutoffHour = settings?.cutoff_hour ?? 18;
  const today = romeToday();
  const orders = (data ?? []) as unknown as Order[];
  const upcoming = orders.filter((o) => o.pickup_date >= today).reverse();
  const past = orders.filter((o) => o.pickup_date < today);
  const spent = past.filter((o) => o.status === "ritirato").reduce((sum, o) => sum + o.price_cents, 0);
  const catOrder = (c: string) => BASE_CATEGORIES.findIndex((x) => x.value === c);

  const card = (o: Order) => {
    const open = o.status === "confermato" && isOrderOpen(o.pickup_date, cutoffHour);
    return (
      <article
        key={o.id}
        className={cn("flex flex-col gap-2 rounded-lg border bg-card p-4", o.status === "annullato" && "opacity-70")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-base font-semibold first-letter:uppercase">{formatDay(o.pickup_date)}</span>
            <span className="text-sm text-muted-foreground">
              {SLOT_LABEL[o.meal_slot]} · {o.template_name} · {o.kitchens?.name ?? "Gastronomia"}
            </span>
          </div>
          <span className="text-lg font-semibold">{formatEuro(o.price_cents)}</span>
        </div>
        <MealBlob items={o.order_items.map((i) => ({ category: i.category, grams: i.grams }))} size={36} />
        <span className={cn("w-fit rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS[o.status].cls)}>
          {STATUS[o.status].label}
        </span>
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
          <p className="text-xs text-muted-foreground">Allergeni: {o.allergens.map(allergenName).join(", ")}</p>
        )}
        {o.allergens_unverified && (
          <p className="text-xs text-muted-foreground">Allergeni non verificati da confermare in gastronomia</p>
        )}
        {o.status !== "annullato" && o.pickup_date >= today && (
          <Link
            href={`/cliente/ritiro/${o.id}`}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-ink pr-4 pl-3 text-sm font-semibold text-paper transition-colors hover:bg-ink/85"
          >
            <Ticket className="size-4" aria-hidden />
            Mostra al ritiro
            <span className="num text-lemon">#{pickupCode(o.id)}</span>
          </Link>
        )}
        {open && <CancelOrderButton orderId={o.id} label={`il ${SLOT_LABEL[o.meal_slot].toLowerCase()} di ${formatDay(o.pickup_date)}`} />}
      </article>
    );
  };

  return (
    <RoleArea profile={profile} title="I miei ordini" back={{ href: "/cliente", label: "La mia settimana" }}>
      {orders.length === 0 && <p className="rounded-lg bg-muted p-4 text-sm">Non hai ancora fatto ordini.</p>}

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm text-muted-foreground">Prossimi</h2>
          {upcoming.map(card)}
        </section>
      )}

      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm text-muted-foreground">Passati</h2>
            {spent > 0 && <span className="text-xs text-muted-foreground">Ritirati: {formatEuro(spent)}</span>}
          </div>
          {past.map(card)}
        </section>
      )}
    </RoleArea>
  );
}
