"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cookedCostCents, formatEuro, parseEuroToCents, parsePercent, priceFromCost } from "@/lib/pricing";

type Mode = "diretto" | "da_costo";

function centsToInput(cents: number | null): string {
  return cents == null ? "" : (cents / 100).toFixed(2).replace(".", ",");
}

function pctToInput(pct: number | null): string {
  return pct == null ? "" : String(pct).replace(".", ",");
}

// Campi del prezzo con anteprima del calcolo mentre si scrive.
// Il prezzo vero lo calcola e lo salva il database con la stessa formula.
export function PriceFields({
  initial,
}: {
  initial: {
    mode: Mode;
    priceCents: number | null;
    costCents: number | null;
    lossPct: number | null;
    markupPct: number | null;
  };
}) {
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [price, setPrice] = useState(centsToInput(initial.priceCents));
  const [cost, setCost] = useState(centsToInput(initial.costCents));
  const [loss, setLoss] = useState(pctToInput(initial.lossPct ?? 0));
  const [markup, setMarkup] = useState(pctToInput(initial.markupPct));

  const costCents = parseEuroToCents(cost);
  const lossPct = loss.trim() === "" ? 0 : parsePercent(loss);
  const markupPct = parsePercent(markup);
  const preview =
    costCents && lossPct !== null && lossPct < 90 && markupPct !== null
      ? {
          cooked: Math.round(cookedCostCents(costCents, lossPct)),
          price: priceFromCost(costCents, lossPct, markupPct),
        }
      : null;

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="mode" value={mode} />

      <div role="radiogroup" aria-label="Come calcolare il prezzo" className="grid grid-cols-2 gap-2">
        {(
          [
            { value: "da_costo", label: "Dal costo", hint: "fattura + ricarico" },
            { value: "diretto", label: "Prezzo diretto", hint: "lo scrivo io" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={mode === opt.value}
            onClick={() => setMode(opt.value)}
            className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
              mode === opt.value ? "border-primary bg-primary/10" : "bg-background"
            }`}
          >
            <span className="font-medium">{opt.label}</span>
            <span className="text-xs text-muted-foreground">{opt.hint}</span>
          </button>
        ))}
      </div>

      {mode === "diretto" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Prezzo di vendita al kg (€)</Label>
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            required
            placeholder="22,00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-11 text-base"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cost">Costo al kg dalla fattura (€)</Label>
            <Input
              id="cost"
              name="cost"
              inputMode="decimal"
              required
              placeholder="10,00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="loss">Calo peso in cottura (%)</Label>
            <Input
              id="loss"
              name="loss"
              inputMode="decimal"
              placeholder="0"
              value={loss}
              onChange={(e) => setLoss(e.target.value)}
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground">
              Quanto peso perde cucinando (es. pollo circa 25%). 0 per verdure crude, pane, ecc.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="markup">Ricarico sul costo (%)</Label>
            <Input
              id="markup"
              name="markup"
              inputMode="decimal"
              required
              placeholder="30"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
              className="h-11 text-base"
            />
          </div>

          <div className="rounded-lg bg-muted/60 p-4 text-sm" aria-live="polite">
            {preview ? (
              <dl className="flex flex-col gap-1">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Costo al kg da cotto</dt>
                  <dd className="tabular-nums">{formatEuro(preview.cooked)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Guadagno al kg</dt>
                  <dd className="tabular-nums">{formatEuro(preview.price - preview.cooked)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t pt-2 text-base font-medium">
                  <dt>Prezzo di vendita al kg</dt>
                  <dd className="tabular-nums text-primary">{formatEuro(preview.price)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground">
                Scrivi costo e ricarico: qui vedrai il prezzo calcolato da NutriLife.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
