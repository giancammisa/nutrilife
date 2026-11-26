"use client";

import { useActionState, useState } from "react";
import { placeOrder } from "../actions";
import type { FormState } from "@/lib/form";
import { allergenName } from "@/lib/allergens";
import { formatEuro, mealPriceCents } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MealBlob } from "@/components/brand";

type Item = { id: string; baseId: string; name: string; grams: number; category: string; group: number | null };

type TemplateView = {
  id: string;
  name: string;
  slot: "pranzo" | "cena";
  verified: boolean;
  taken: boolean;
  items: Item[];
};

type KitchenView = { id: string; name: string; address: string | null; feeCents: number };
type KitchenBaseView = {
  kitchenId: string;
  baseId: string;
  allergens: string[];
  declared: boolean;
  available: boolean;
  priceCents: number | null;
};

type Option = {
  available: boolean;
  priceCents: number | null;
  allergens: string[];
  unverified: boolean;
  conflict: string[];
  intolerance: string[];
};

// Righe del pasto: le fisse + l'alternativa scelta per ogni gruppo (la prima se non scelta).
function chosenItems(t: TemplateView, choices: Record<number, string>): Item[] {
  const firstOf = new Map<number, string>();
  for (const i of t.items) if (i.group != null && !firstOf.has(i.group)) firstOf.set(i.group, i.id);
  return t.items.filter((i) => i.group == null || i.id === (choices[i.group] ?? firstOf.get(i.group)));
}

// Stesse regole del database: disponibilita, prezzo, allergeni.
function optionFor(
  items: Item[],
  k: KitchenView,
  kbs: KitchenBaseView[],
  allergies: string[],
  intolerances: string[],
): Option {
  const lines = items.map((i) => ({ i, kb: kbs.find((x) => x.kitchenId === k.id && x.baseId === i.baseId) }));
  const available = lines.length > 0 && lines.every((l) => l.kb && l.kb.available && l.kb.priceCents);
  const allergens = [...new Set(lines.flatMap((l) => l.kb?.allergens ?? []))].sort();
  return {
    available,
    priceCents: available
      ? mealPriceCents(
          lines.map((l) => ({ grams: l.i.grams, pricePerKgCents: l.kb!.priceCents! })),
          k.feeCents,
        )
      : null,
    allergens,
    unverified: lines.some((l) => l.kb && !l.kb.declared),
    conflict: allergens.filter((a) => allergies.includes(a)),
    intolerance: allergens.filter((a) => intolerances.includes(a)),
  };
}

const SLOT_LABEL = { pranzo: "Pranzo", cena: "Cena" } as const;

function Choice({
  selected,
  disabled,
  onSelect,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-1 rounded-[24px] border p-4 text-left transition-colors disabled:opacity-50",
        selected
          ? "border-transparent bg-lemon text-ink [&_.text-muted-foreground]:text-ink/70"
          : "bg-card hover:border-ink/25",
      )}
    >
      {children}
    </button>
  );
}

export function OrderForm({
  day,
  templates,
  kitchens,
  kitchenBases,
  allergies,
  intolerances,
}: {
  day: string;
  templates: TemplateView[];
  kitchens: KitchenView[];
  kitchenBases: KitchenBaseView[];
  allergies: string[];
  intolerances: string[];
}) {
  const firstFree = templates.find((t) => !t.taken);
  const [templateId, setTemplateId] = useState<string | null>(firstFree?.id ?? null);
  const [kitchenId, setKitchenId] = useState<string | null>(
    kitchens.length === 1 ? kitchens[0].id : null,
  );
  const [ack, setAck] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>({});
  // "Dividi": ogni parte del pasto puo' venire da un punto vendita diverso
  const [split, setSplit] = useState(false);
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState<FormState, FormData>(placeOrder, { error: null, ok: null });

  const template = templates.find((t) => t.id === templateId) ?? null;
  const items = template ? chosenItems(template, choices) : [];
  const optionAt = (k: KitchenView) => optionFor(items, k, kitchenBases, allergies, intolerances);
  const canSupply = (i: Item, k: KitchenView) =>
    kitchenBases.some((kb) => kb.kitchenId === k.id && kb.baseId === i.baseId && kb.available && kb.priceCents);
  // Chi prepara ogni riga: il punto vendita unico, oppure quello scelto riga per riga
  const supplier = (i: Item): string | null => (split ? (assign[i.id] ?? null) : kitchenId);
  const parts = kitchens
    .map((k) => ({ k, items: items.filter((i) => supplier(i) === k.id) }))
    .filter((p) => p.items.length > 0)
    .map((p) => ({ ...p, option: optionFor(p.items, p.k, kitchenBases, allergies, intolerances) }));
  const allAssigned = items.length > 0 && items.every((i) => supplier(i) != null);
  const available = allAssigned && parts.every((p) => p.option.available);
  const totalCents = available ? parts.reduce((sum, p) => sum + (p.option.priceCents ?? 0), 0) : null;
  const summary = {
    allergens: [...new Set(parts.flatMap((p) => p.option.allergens))].sort(),
    conflict: [...new Set(parts.flatMap((p) => p.option.conflict))],
    intolerance: [...new Set(parts.flatMap((p) => p.option.intolerance))],
    unverified: parts.some((p) => p.option.unverified),
  };
  // Gruppi di alternative del pasto scelto (solo quelli con almeno due basi)
  const groups = template
    ? [...new Set(template.items.filter((i) => i.group != null).map((i) => i.group as number))]
        .map((g) => template.items.filter((i) => i.group === g))
        .filter((alts) => alts.length > 1)
    : [];
  const blocked = summary.conflict.length > 0;
  const canSubmit = available && !blocked && (!summary.unverified || ack) && !template?.taken;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="template_id" value={templateId ?? ""} />
      <input
        type="hidden"
        name="parts"
        value={JSON.stringify(parts.map((p) => ({ kitchen_id: p.k.id, items: p.items.map((i) => i.id) })))}
      />

      <section className="flex flex-col gap-2" role="radiogroup" aria-label="Pasto tipo">
        <h2 className="section-title">Quale pasto</h2>
        {templates.map((t) => (
          <Choice
            key={t.id}
            selected={templateId === t.id}
            disabled={t.taken}
            onSelect={() => {
              setTemplateId(t.id);
              setChoices({});
              setAck(false);
            }}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-base font-semibold">{t.name}</span>
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  {SLOT_LABEL[t.slot]}
                </span>
              </span>
              <MealBlob items={t.id === templateId ? items : chosenItems(t, {})} size={40} />
            </span>
            <span className="text-sm text-muted-foreground">
              {t.taken
                ? `Hai già ordinato il ${SLOT_LABEL[t.slot].toLowerCase()} di questo giorno`
                : (t.id === templateId ? items : chosenItems(t, {})).map((i) => `${i.name} ${i.grams} g`).join(" · ")}
            </span>
          </Choice>
        ))}
      </section>

      {groups.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="section-title">Scegli tu</h2>
            <p className="text-sm text-muted-foreground">Il tuo nutrizionista ti lascia scegliere tra queste basi.</p>
          </div>
          {groups.map((alts) => {
            const g = alts[0].group as number;
            const current = choices[g] ?? alts[0].id;
            return (
              <div key={g} role="radiogroup" aria-label={`Scelta ${g}`} className="flex flex-wrap gap-2">
                {alts.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    role="radio"
                    aria-checked={current === i.id}
                    onClick={() => {
                      setChoices((c) => ({ ...c, [g]: i.id }));
                      setAck(false);
                    }}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                      current === i.id ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white/70 hover:bg-white",
                    )}
                  >
                    {i.name}
                    <span className={cn("num text-xs", current === i.id ? "text-lemon" : "text-muted-foreground")}>
                      {i.grams} g
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="section-title">Dove lo ritiri</h2>
          {kitchens.length > 1 && template && (
            <button
              type="button"
              aria-pressed={split}
              onClick={() => {
                setAck(false);
                if (!split) {
                  // si parte dal punto vendita gia' scelto, dove puo' fornire la base
                  const first: Record<string, string> = {};
                  for (const i of items) {
                    const cur = kitchens.find((k) => k.id === kitchenId);
                    const k = cur && canSupply(i, cur) ? cur : kitchens.find((x) => canSupply(i, x));
                    if (k) first[i.id] = k.id;
                  }
                  setAssign(first);
                }
                setSplit(!split);
              }}
              className={cn(
                "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                split ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white/70 hover:bg-white",
              )}
            >
              {split ? "Un solo punto" : "Dividi tra più punti"}
            </button>
          )}
        </div>

        {!split && (
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Punto di ritiro">
            {kitchens.map((k) => {
              const o = template ? optionAt(k) : null;
              return (
                <Choice
                  key={k.id}
                  selected={kitchenId === k.id}
                  disabled={!o?.available}
                  onSelect={() => {
                    setKitchenId(k.id);
                    setAck(false);
                  }}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{k.name}</span>
                    <span className="text-base font-semibold">
                      {o?.available && o.priceCents != null ? formatEuro(o.priceCents) : "non ha tutto"}
                    </span>
                  </span>
                  {k.address && <span className="text-sm text-muted-foreground">{k.address}</span>}
                </Choice>
              );
            })}
            {kitchens.length > 1 && template && !kitchens.some((k) => optionAt(k).available) && (
              <p className="rounded-[20px] bg-warning/10 p-3 text-sm">
                Nessun punto vendita ha tutto il pasto: usa &quot;Dividi tra più punti&quot; e scegli dove prendere
                ogni parte.
              </p>
            )}
          </div>
        )}

        {split && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Scegli dove prendere ogni parte. Ritirerai in più punti, ognuno con il suo biglietto e il suo costo
              fisso.
            </p>
            {items.map((i) => {
              const sellers = kitchens.filter((k) => canSupply(i, k));
              return (
                <div key={i.id} role="radiogroup" aria-label={`Dove prendere ${i.name}`} className="flex flex-col gap-2">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="card-title">{i.name}</span>
                    <span className="num text-sm text-muted-foreground">{i.grams} g</span>
                  </span>
                  {sellers.length === 0 ? (
                    <p className="text-sm text-destructive">Nessun punto vendita ha questa base.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sellers.map((k) => {
                        const kb = kitchenBases.find((x) => x.kitchenId === k.id && x.baseId === i.baseId);
                        const on = assign[i.id] === k.id;
                        return (
                          <button
                            key={k.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => {
                              setAssign((a) => ({ ...a, [i.id]: k.id }));
                              setAck(false);
                            }}
                            className={cn(
                              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                              on ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white/70 hover:bg-white",
                            )}
                          >
                            {k.name}
                            <span className={cn("num text-xs", on ? "text-lemon" : "text-muted-foreground")}>
                              {formatEuro(Math.round((i.grams * (kb?.priceCents ?? 0)) / 1000))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {parts.length > 1 && (
        <section className="flex flex-col gap-3 rounded-[28px] border bg-card p-5" aria-live="polite">
          <h2 className="section-title">Ritiri in {parts.length} punti</h2>
          {parts.map((p) => (
            <div key={p.k.id} className="flex flex-col gap-1 border-t pt-3 first:border-t-0 first:pt-0">
              <span className="flex items-baseline justify-between gap-3">
                <span className="card-title">{p.k.name}</span>
                <span className="num text-base">{p.option.available ? formatEuro(p.option.priceCents ?? 0) : "—"}</span>
              </span>
              {p.k.address && <span className="text-xs text-muted-foreground">{p.k.address}</span>}
              <span className="text-sm">{p.items.map((i) => `${i.name} ${i.grams} g`).join(" · ")}</span>
              <span className="text-xs text-muted-foreground">
                Costo fisso {formatEuro(p.k.feeCents)} incluso in questo punto
              </span>
            </div>
          ))}
        </section>
      )}

      {available && (
        <section className="flex flex-col gap-3 rounded-lg border bg-card p-4" aria-live="polite">
          <h2 className="section-title">Allergeni</h2>

          {summary.allergens.length === 0 && !summary.unverified && (
            <p className="text-sm text-primary">Nessun allergene dichiarato in questo pasto.</p>
          )}
          {summary.allergens.length > 0 && (
            <p className="text-sm">
              Contiene: <strong>{summary.allergens.map(allergenName).join(", ")}</strong>
            </p>
          )}

          {blocked && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <strong>Ordine bloccato.</strong> Contiene {summary.conflict.map(allergenName).join(", ")}, che
              hai indicato tra le tue allergie.
            </p>
          )}

          {!blocked && summary.intolerance.length > 0 && (
            <p className="rounded-lg bg-accent/30 p-3 text-sm">
              Attenzione: contiene {summary.intolerance.map(allergenName).join(", ")}, che hai indicato tra
              le intolleranze.
            </p>
          )}

          {!blocked && summary.unverified && (
            <div className="flex flex-col gap-3 rounded-lg bg-warning/15 p-3 text-sm">
              <p>
                <strong>Allergeni non verificati:</strong> la gastronomia non ha ancora confermato gli
                allergeni di alcune basi di questo pasto.
              </p>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="ack_unverified"
                  name="ack_unverified"
                  checked={ack}
                  onCheckedChange={(v) => setAck(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="ack_unverified" className="font-normal leading-relaxed">
                  Confermo che verificherò gli allergeni con la gastronomia
                </Label>
              </div>
            </div>
          )}
        </section>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="sticky bottom-3 flex flex-col gap-3 rounded-[28px] border border-white/10 bg-ink/90 p-4 text-paper backdrop-blur-xl text-paper pb-[max(1rem,env(safe-area-inset-bottom))]">
        {totalCents != null && (
          <p className="flex items-baseline justify-between">
            <span className="text-sm text-paper/70">
              {parts.length > 1 ? `Totale in ${parts.length} punti, paghi al ritiro` : "Totale, paghi al ritiro"}
            </span>
            <span className="display text-4xl text-lemon">{formatEuro(totalCents)}</span>
          </p>
        )}
        <Button type="submit" size="lg" variant="lemon" className="h-12 rounded-full text-base" disabled={!canSubmit || pending}>
          {pending ? "Invio…" : "Conferma ordine"}
        </Button>
      </div>
    </form>
  );
}
