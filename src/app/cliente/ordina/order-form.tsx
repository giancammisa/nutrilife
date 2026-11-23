"use client";

import { useActionState, useState } from "react";
import { placeOrder } from "../actions";
import type { FormState } from "@/lib/form";
import { allergenName } from "@/lib/allergens";
import { formatEuro } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MealBlob } from "@/components/brand";

export type Option = {
  templateId: string;
  kitchenId: string;
  available: boolean;
  priceCents: number | null;
  allergens: string[];
  unverified: boolean;
  conflict: string[];
  intolerance: string[];
};

type TemplateView = {
  id: string;
  name: string;
  slot: "pranzo" | "cena";
  taken: boolean;
  items: { name: string; grams: number; category: string }[];
};

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
          : "bg-card hover:border-white/25",
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
  options,
}: {
  day: string;
  templates: TemplateView[];
  kitchens: { id: string; name: string; address: string | null }[];
  options: Option[];
}) {
  const firstFree = templates.find((t) => !t.taken);
  const [templateId, setTemplateId] = useState<string | null>(firstFree?.id ?? null);
  const [kitchenId, setKitchenId] = useState<string | null>(
    kitchens.length === 1 ? kitchens[0].id : null,
  );
  const [ack, setAck] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(placeOrder, { error: null, ok: null });

  const option = options.find((o) => o.templateId === templateId && o.kitchenId === kitchenId) ?? null;
  const template = templates.find((t) => t.id === templateId) ?? null;
  const blocked = Boolean(option && option.conflict.length > 0);
  const canSubmit =
    Boolean(option?.available) && !blocked && (!option?.unverified || ack) && !template?.taken;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="template_id" value={templateId ?? ""} />
      <input type="hidden" name="kitchen_id" value={kitchenId ?? ""} />

      <section className="flex flex-col gap-2" role="radiogroup" aria-label="Pasto tipo">
        <h2 className="text-lg">Quale pasto</h2>
        {templates.map((t) => (
          <Choice
            key={t.id}
            selected={templateId === t.id}
            disabled={t.taken}
            onSelect={() => {
              setTemplateId(t.id);
              setAck(false);
            }}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-base font-semibold">{t.name}</span>
                <span className="text-xs font-semibold uppercase text-muted-foreground">{SLOT_LABEL[t.slot]}</span>
              </span>
              <MealBlob items={t.items} size={40} outline={templateId === t.id ? "var(--ink)" : undefined} />
            </span>
            <span className="text-sm text-muted-foreground">
              {t.taken
                ? `Hai già ordinato il ${SLOT_LABEL[t.slot].toLowerCase()} di questo giorno`
                : t.items.map((i) => `${i.name} ${i.grams} g`).join(" · ")}
            </span>
          </Choice>
        ))}
      </section>

      <section className="flex flex-col gap-2" role="radiogroup" aria-label="Gastronomia">
        <h2 className="text-lg">Dove lo ritiri</h2>
        {kitchens.map((k) => {
          const o = options.find((x) => x.templateId === templateId && x.kitchenId === k.id);
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
          <h2 className="text-lg">Allergeni</h2>

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

      <div className="glass sticky bottom-3 flex flex-col gap-3 rounded-[28px] !bg-ink/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {option?.available && option.priceCents != null && (
          <p className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Totale, paghi al ritiro</span>
            <span className="display text-4xl text-lemon">{formatEuro(option.priceCents)}</span>
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 rounded-full text-base" disabled={!canSubmit || pending}>
          {pending ? "Invio…" : "Conferma ordine"}
        </Button>
      </div>
    </form>
  );
}
