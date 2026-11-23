// Codice di ritiro: le ultime 4 cifre del numero interno dell'ordine, in maiuscolo.
// Il cliente lo mostra al banco, la cucina lo trova sulla scheda e sull'etichetta.
// Non è garantito unico: al banco si controlla sempre anche il nome.
export function pickupCode(orderId: string): string {
  return orderId.replace(/-/g, "").slice(-4).toUpperCase();
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
