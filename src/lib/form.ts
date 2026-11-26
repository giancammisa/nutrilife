// Aiuti comuni per leggere e controllare i moduli nelle Server Actions.

export type FormState = { error: string | null; ok: string | null };

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// Tutti i valori UUID validi di un campo ripetuto (es. più basi scelte), senza doppioni.
export function uuids(formData: FormData, key: string, max = 300): string[] {
  return [...new Set(formData.getAll(key).map(String).filter((v) => UUID.test(v)))].slice(0, max);
}

export function uuid(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return UUID.test(value) ? value : null;
}

export function dbError(code: string | undefined): string {
  if (code === "23505") return "Esiste già un elemento uguale.";
  if (code === "42501") return "Non hai i permessi per questa operazione.";
  if (code === "23514") return "Uno dei valori non è valido.";
  return "Salvataggio non riuscito. Riprova.";
}
