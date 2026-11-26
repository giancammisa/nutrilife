import "server-only";
import { createClient } from "@/lib/supabase/server";
import { romeToday } from "@/lib/dates";

// Premi stile Strava: si premia la COSTANZA, mai il peso (NutriLife non lo registra).
// L'app non giudica cosa mangi: conta ogni pasto pesato RITIRATO.
// Un pasto diviso tra più punti vendita conta una volta sola (stesso carrello).
// Il giudizio vero è il Gold: lo assegna il nutrizionista dopo il controllo.

export const WEEK_TARGET = 3; // pasti ritirati per considerare "fatta" una settimana
export const POINTS_PER_MEAL = 10;
export const POINTS_PER_WEEK = 20; // bonus per ogni settimana fatta

export type Milestone = {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  progress: number; // 0..1
};

export type Gold = { id: string; awardedOn: string; nutritionist: string | null };

export type Rewards = {
  meals: number;
  points: number;
  streakWeeks: number;
  thisWeek: number;
  monthMeals: number;
  monthKg: { proteina: number; carboidrato: number; verdura: number; frutta: number };
  golds: Gold[];
  milestones: Milestone[];
};

type Row = {
  basket_id: string;
  pickup_date: string;
  order_items: { category: string; grams: number }[];
};

// Lunedì della settimana di una data AAAA-MM-GG (date a mezzogiorno UTC: niente problemi di fuso)
export function weekStart(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}
function prevWeek(monday: string): string {
  const d = new Date(`${monday}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

export async function getRewards(clientId: string): Promise<Rewards> {
  const supabase = await createClient();
  const [{ data }, { data: goldData }] = await Promise.all([
    supabase
      .from("orders")
      .select("basket_id, pickup_date, order_items(category, grams)")
      .eq("client_id", clientId)
      .eq("status", "ritirato")
      .order("pickup_date", { ascending: false })
      .limit(2000),
    // Se la tabella non c'è ancora (SQL 0015 non eseguito) torna vuoto: nessun errore per il cliente.
    supabase
      .from("gold_awards")
      .select("id, awarded_on, nutritionist:profiles!gold_awards_nutritionist_id_fkey(full_name)")
      .eq("client_id", clientId)
      .order("awarded_on", { ascending: false }),
  ]);

  // Un pasto = un carrello
  const meals = new Map<string, { date: string; items: Row["order_items"] }>();
  for (const r of (data ?? []) as unknown as Row[]) {
    const m = meals.get(r.basket_id) ?? { date: r.pickup_date, items: [] };
    m.items.push(...r.order_items);
    meals.set(r.basket_id, m);
  }
  const list = [...meals.values()];

  // Settimane fatte di fila (la settimana in corso conta solo se già raggiunta)
  const perWeek = new Map<string, number>();
  for (const m of list) perWeek.set(weekStart(m.date), (perWeek.get(weekStart(m.date)) ?? 0) + 1);
  const today = romeToday();
  const current = weekStart(today);
  const thisWeek = perWeek.get(current) ?? 0;
  let streakWeeks = 0;
  let w = thisWeek >= WEEK_TARGET ? current : prevWeek(current);
  while ((perWeek.get(w) ?? 0) >= WEEK_TARGET) {
    streakWeeks += 1;
    w = prevWeek(w);
  }
  const weeksDone = [...perWeek.values()].filter((n) => n >= WEEK_TARGET).length;

  // Numeri del mese in corso (grammi dei pasti, non del corpo)
  const month = today.slice(0, 7);
  const monthKg = { proteina: 0, carboidrato: 0, verdura: 0, frutta: 0 };
  let monthMeals = 0;
  for (const m of list) {
    if (!m.date.startsWith(month)) continue;
    monthMeals += 1;
    for (const i of m.items) {
      if (i.category in monthKg) monthKg[i.category as keyof typeof monthKg] += i.grams / 1000;
    }
  }
  const total = list.length;
  const points = total * POINTS_PER_MEAL + weeksDone * POINTS_PER_WEEK;

  const golds: Gold[] = ((goldData ?? []) as unknown as {
    id: string;
    awarded_on: string;
    nutritionist: { full_name: string | null } | null;
  }[]).map((g) => ({ id: g.id, awardedOn: g.awarded_on, nutritionist: g.nutritionist?.full_name ?? null }));

  const count = (id: string, n: number, title: string): Milestone => ({
    id,
    title,
    detail: `${Math.min(total, n)} di ${n} pasti`,
    done: total >= n,
    progress: Math.min(1, total / n),
  });
  const milestones: Milestone[] = [
    count("primo", 1, "Primo pasto pesato"),
    count("10", 10, "10 pasti"),
    count("25", 25, "25 pasti"),
    count("50", 50, "50 pasti"),
    count("100", 100, "100 pasti"),
    {
      id: "mese",
      title: "Un mese di fila",
      detail: `${Math.min(streakWeeks, 4)} di 4 settimane`,
      done: streakWeeks >= 4,
      progress: Math.min(1, streakWeeks / 4),
    },
    {
      id: "trimestre",
      title: "Tre mesi di fila",
      detail: `${Math.min(streakWeeks, 12)} di 12 settimane`,
      done: streakWeeks >= 12,
      progress: Math.min(1, streakWeeks / 12),
    },
  ];

  return { meals: total, points, streakWeeks, thisWeek, monthMeals, monthKg, golds, milestones };
}
