// Date e orario limite, sempre con l'ora di Roma.
// Le date dei ritiri sono stringhe "AAAA-MM-GG" (giorno di calendario, senza orario).
// Il controllo vero lo fa il database (order_window_open); qui serve per mostrare la pagina.

const TZ = "Europe/Rome";

const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// Data e ora di Roma di un istante, come stringhe ordinabili.
export function romeParts(instant: Date = new Date()): { date: string; time: string } {
  const p = Object.fromEntries(partsFmt.formatToParts(instant).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export function romeToday(instant: Date = new Date()): string {
  return romeParts(instant).date;
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Si può ancora ordinare per il ritiro di "pickup"? Fino al giorno prima alle cutoffHour (ora di Roma).
// Confronto tra orari "locali di Roma": funziona anche nei giorni del cambio dell'ora.
export function isOrderOpen(pickup: string, cutoffHour: number, instant: Date = new Date()): boolean {
  const now = romeParts(instant);
  const limit = `${addDays(pickup, -1)} ${String(cutoffHour).padStart(2, "0")}:00`;
  return `${now.date} ${now.time}` < limit;
}

const dayFmt = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

// "lunedì 24 novembre"
export function formatDay(date: string): string {
  return dayFmt.format(new Date(`${date}T12:00:00Z`));
}

// "entro domenica 23 novembre alle 18:00"
export function formatCutoff(pickup: string, cutoffHour: number): string {
  return `entro ${formatDay(addDays(pickup, -1))} alle ${String(cutoffHour).padStart(2, "0")}:00`;
}
