// Prezzi: tutto in centesimi di euro (interi), per evitare errori di arrotondamento.
// La formula è la stessa della funzione SQL public.price_from_cost: il database ha l'ultima parola.

const euroFmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function formatEuro(cents: number): string {
  return euroFmt.format(cents / 100);
}

// Accetta "10", "10,5", "10,50", "10.50", "€ 10,50". Restituisce centesimi o null.
export function parseEuroToCents(input: string): number | null {
  const clean = input.replace(/[€\s]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

// Accetta "25", "25,5", "25.5". Restituisce il numero o null.
export function parsePercent(input: string): number | null {
  const clean = input.replace(/[%\s]/g, "").replace(",", ".");
  if (clean === "") return null;
  if (!/^\d+(\.\d)?$/.test(clean)) return null;
  return Number(clean);
}

// costo cotto = costo ÷ (1 − calo%)      prezzo = costo cotto × (1 + ricarico%)
export function cookedCostCents(costCents: number, lossPct: number): number {
  return costCents / (1 - lossPct / 100);
}

export function priceFromCost(costCents: number, lossPct: number, markupPct: number): number {
  return Math.round(cookedCostCents(costCents, lossPct) * (1 + markupPct / 100));
}

// Prezzo di una base nel pasto: grammi × prezzo al kg.
export function lineCents(grams: number, pricePerKgCents: number): number {
  return (grams * pricePerKgCents) / 1000;
}

// Prezzo del pasto: somma delle righe (arrotondata) + costo fisso. Stessa regola di meal_price_cents.
export function mealPriceCents(
  items: { grams: number; pricePerKgCents: number }[],
  fixedFeeCents: number,
): number {
  const sum = items.reduce((acc, i) => acc + i.grams * i.pricePerKgCents, 0);
  return Math.round(sum / 1000) + fixedFeeCents;
}
