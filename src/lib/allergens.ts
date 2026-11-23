// I 14 allergeni UE (Reg. UE 1169/2011). Stessi codici della tabella public.allergens.
export const ALLERGENS = [
  { code: "glutine", name: "Cereali con glutine" },
  { code: "crostacei", name: "Crostacei" },
  { code: "uova", name: "Uova" },
  { code: "pesce", name: "Pesce" },
  { code: "arachidi", name: "Arachidi" },
  { code: "soia", name: "Soia" },
  { code: "latte", name: "Latte e lattosio" },
  { code: "frutta_a_guscio", name: "Frutta a guscio" },
  { code: "sedano", name: "Sedano" },
  { code: "senape", name: "Senape" },
  { code: "sesamo", name: "Semi di sesamo" },
  { code: "solfiti", name: "Anidride solforosa e solfiti" },
  { code: "lupini", name: "Lupini" },
  { code: "molluschi", name: "Molluschi" },
] as const;

export type AllergenCode = (typeof ALLERGENS)[number]["code"];

const CODES = new Set<string>(ALLERGENS.map((a) => a.code));

export function isAllergenCode(value: string): value is AllergenCode {
  return CODES.has(value);
}

export function allergenName(code: string): string {
  return ALLERGENS.find((a) => a.code === code)?.name ?? code;
}

// Modello a tre stati (dalla demo).
export type AllergenState = "non_verificato" | "nessuno" | "contiene";

export function allergenState(declared: boolean, allergens: string[]): AllergenState {
  if (!declared) return "non_verificato";
  return allergens.length === 0 ? "nessuno" : "contiene";
}

export const BASE_CATEGORIES = [
  { value: "proteina", label: "Proteina" },
  { value: "carboidrato", label: "Carboidrato" },
  { value: "verdura", label: "Verdura" },
  { value: "altro", label: "Altro" },
] as const;

export type BaseCategory = (typeof BASE_CATEGORIES)[number]["value"];

export function categoryLabel(value: string): string {
  return BASE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
