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
  const [state, action, pending] = useActionState<FormState, FormData>(placeOrder, { error: null, ok: null });

  const template = templates.find((t) => t.id === templateId) ?? null;
  const items = template ? chosenItems(template, choices) : [];
  const optionAt = (k: KitchenView) => optionFor(items, k, kitchenBases, allergies, intolerances);
  const kitchen = kitchens.find((k) => k.id === kitchenId) ?? null;
  const option = template && kitchen ? optionAt(kitchen) : null;
  // Gruppi di alternative del pasto scelto (solo quelli con almeno due basi)
  const groups = template
    ? [...new Set(template.items.filter((i) => i.group != null).map((i) => i.group as number))]
        .map((g) => template.items.filter((i) => i.group === g))
        .filter((alts) => alts.length > 1)
    : [];
  const blocked = Boolean(option && option.conflict.length > 0);
  const canSubmit =
    Boolean(option?.available) && !blocked && (!option?.unverified || ack) && !template?.taken;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="template_id" value={templateId ?? ""} />
      <input type="hidden" name="kitchen_id" value={kitchenId ?? ""} />
      {items.map((i) => (
        <input key={i.id} type="hidden" name="items" value={i.id} />
      ))}

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
                <span className="text-xs font-semibold uppercase text-muted-foreground">{SLOT_LABEL[t.slot]}</span>
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

      <section className="flex flex-col gap-2" role="radiogroup" aria-label="Gastronomia">
        <h2 className="section-title">Dove lo ritiri</h2>
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
                  {o?.available && o.priceCents != null ? formatEuro(o.priceCents) : "non disponibile"}
                </span>
              </span>
              {k.address && <span className="text-sm text-muted-foreground">{k.address}</span>}
            </Choice>
          );
        })}
      </section>

      {option?.available && (
        <section className="flex flex-col gap-3 rounded-lg border bg-card p-4" aria-live="polite">
          <h2 className="section-title">Allergeni</h2>

          {option.allergens.length === 0 && !option.unverified && (
            <p className="text-sm text-primary">Nessun allergene dichiarato in questo pasto.</p>
          )}
          {option.allergens.length > 0 && (
            <p className="text-sm">
              Contiene: <strong>{option.allergens.map(allergenName).join(", ")}</strong>
            </p>
          )}

          {blocked && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <strong>Ordine bloccato.</strong> Contiene {option.conflict.map(allergenName).join(", ")}, che
              hai indicato tra le tue allergie.
            </p>
          )}

          {!blocked && option.intolerance.length > 0 && (
            <p className="rounded-lg bg-accent/30 p-3 text-sm">
              Attenzione: contiene {option.intolerance.map(allergenName).join(", ")}, che hai indicato tra
              le intolleranze.
            </p>
          )}

          {!blocked && option.unverified && (
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
        {option?.available && option.priceCents != null && (
          <p className="flex items-baseline justify-between">
            <span className="text-sm text-paper/70">Totale, paghi al ritiro</span>
            <span className="display text-4xl text-lemon">{formatEuro(option.priceCents)}</span>
          </p>
        )}
        <Button type="submit" size="lg" variant="lemon" className="h-12 rounded-full text-base" disabled={!canSubmit || pending}>
          {pending ? "Invio…" : "Conferma ordine"}
        </Button>
      </div>
    </form>
  );
}
