"use client";

import { useId, useState } from "react";
import { Check, Search } from "lucide-react";
import { BASE_CATEGORIES } from "@/lib/allergens";
import { cn } from "@/lib/utils";

type Base = { id: string; name: string; category: string };

const PLURAL: Record<string, string> = {
  proteina: "Proteine",
  carboidrato: "Carboidrati",
  verdura: "Verdure",
  altro: "Altro",
};

// Scelta di una base dal catalogo: o si cerca per nome, o si apre una categoria
// (Proteine, Carboidrati, Verdure, Altro) e si sceglie dall'elenco.
// Il valore scelto va nel modulo come campo nascosto `name`.
export function BasePicker({ bases, name = "base_id", label = "Base" }: { bases: Base[]; name?: string; label?: string }) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const chosen = bases.find((b) => b.id === selected) ?? null;
  const list = q
    ? bases.filter((b) => b.name.toLowerCase().includes(q))
    : category
      ? bases.filter((b) => b.category === category)
      : [];
  const counts = Object.fromEntries(BASE_CATEGORIES.map((c) => [c.value, bases.filter((b) => b.category === c.value).length]));

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={chosen?.id ?? ""} />
      <span id={`${uid}-label`} className="text-base leading-none font-semibold">
        {label}
      </span>

      <label className="relative flex items-center">
        <span className="sr-only">Cerca una base</span>
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca una base…"
          autoComplete="off"
          className="h-12 w-full rounded-full border border-input bg-white/80 pr-4 pl-9 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      {!q && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorie">
          {BASE_CATEGORIES.map((c) =>
            counts[c.value] ? (
              <button
                key={c.value}
                type="button"
                aria-pressed={category === c.value}
                onClick={() => setCategory(category === c.value ? null : c.value)}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                  category === c.value ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white/70 hover:bg-white",
                )}
              >
                {PLURAL[c.value]}
                <span className={cn("num text-xs", category === c.value ? "text-lemon" : "text-muted-foreground")}>
                  {counts[c.value]}
                </span>
              </button>
            ) : null,
          )}
        </div>
      )}

      {(q || category) && (
        <div
          role="radiogroup"
          aria-labelledby={`${uid}-label`}
          className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-[20px] border border-ink/10 bg-white/60 p-1.5"
        >
          {list.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nessuna base trovata.</p>}
          {list.map((b) => {
            const on = b.id === selected;
            return (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSelected(b.id)}
                className={cn(
                  "flex min-h-11 items-center justify-between gap-3 rounded-[14px] px-3 text-left text-base transition-colors",
                  on ? "bg-grad-lime font-semibold text-ink" : "hover:bg-white",
                )}
              >
                <span>
                  {b.name}
                  {q && <span className="ml-2 text-xs text-muted-foreground">{PLURAL[b.category]}</span>}
                </span>
                {on && <Check className="size-4 shrink-0" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {chosen ? (
          <>
            Scelta: <span className="font-semibold text-foreground">{chosen.name}</span>
          </>
        ) : (
          "Cerca per nome oppure apri una categoria."
        )}
      </p>
    </div>
  );
}
