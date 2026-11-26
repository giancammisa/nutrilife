"use client";

import { useId, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { BASE_CATEGORIES } from "@/lib/allergens";
import { cn } from "@/lib/utils";

type Base = { id: string; name: string; category: string };

const PLURAL: Record<string, string> = {
  proteina: "Proteine",
  carboidrato: "Carboidrati",
  verdura: "Verdure",
  frutta: "Frutta",
  altro: "Altro",
};

// Scelta delle basi dal catalogo: o si cerca per nome, o si apre una categoria
// (Proteine, Carboidrati, Verdure…) e si sceglie dall'elenco.
// Con `multiple` se ne scelgono quante si vuole (es. il listino di una gastronomia):
// ogni base scelta va nel modulo come campo nascosto `name` (ripetuto).
export function BasePicker({
  bases,
  name = "base_id",
  label = "Base",
  multiple = false,
}: {
  bases: Base[];
  name?: string;
  label?: string;
  multiple?: boolean;
}) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();
  // Solo le basi ancora nel catalogo (dopo l'aggiunta spariscono da sole)
  const chosen = bases.filter((b) => selected.has(b.id));
  const list = q
    ? bases.filter((b) => b.name.toLowerCase().includes(q))
    : category
      ? bases.filter((b) => b.category === category)
      : [];
  const counts = Object.fromEntries(BASE_CATEGORIES.map((c) => [c.value, bases.filter((b) => b.category === c.value).length]));
  const allInList = list.length > 0 && list.every((b) => selected.has(b.id));

  function toggle(id: string) {
    setSelected((prev) => {
      if (!multiple) return new Set([id]);
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleList() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const b of list) {
        if (allInList) next.delete(b.id);
        else next.add(b.id);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {chosen.map((b) => (
        <input key={b.id} type="hidden" name={name} value={b.id} />
      ))}
      {chosen.length === 0 && <input type="hidden" name={name} value="" />}
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
        <div className="flex flex-col gap-2">
          {multiple && list.length > 1 && (
            <button
              type="button"
              onClick={toggleList}
              className="self-start text-sm font-semibold underline underline-offset-4"
            >
              {allInList ? "Togli tutte queste" : `Scegli tutte queste (${list.length})`}
            </button>
          )}
          <div
            role={multiple ? "group" : "radiogroup"}
            aria-labelledby={`${uid}-label`}
            className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-[20px] border border-ink/10 bg-white/60 p-1.5"
          >
            {list.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nessuna base trovata.</p>}
            {list.map((b) => {
              const on = selected.has(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  role={multiple ? "checkbox" : "radio"}
                  aria-checked={on}
                  onClick={() => toggle(b.id)}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-3 rounded-[14px] px-3 text-left text-base transition-colors",
                    on ? "bg-grad-lime font-semibold text-ink" : "hover:bg-white",
                  )}
                >
                  <span>
                    {b.name}
                    {q && <span className="ml-2 text-xs text-muted-foreground">{PLURAL[b.category]}</span>}
                  </span>
                  {multiple ? (
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded-md border",
                        on ? "border-ink bg-ink text-lemon" : "border-ink/25 bg-white",
                      )}
                    >
                      {on && <Check className="size-3.5" />}
                    </span>
                  ) : (
                    on && <Check className="size-4 shrink-0" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {multiple && chosen.length > 0 ? (
        <div className="flex flex-col gap-2" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">
              {chosen.length === 1 ? "1 base scelta" : `${chosen.length} basi scelte`}
            </span>
            <button type="button" onClick={() => setSelected(new Set())} className="text-sm underline underline-offset-4">
              Svuota
            </button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {chosen.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => toggle(b.id)}
                  aria-label={`Togli ${b.name}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink pr-2.5 pl-3.5 text-sm font-semibold text-paper"
                >
                  {b.name}
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {chosen[0] ? (
            <>
              Scelta: <span className="font-semibold text-foreground">{chosen[0].name}</span>
            </>
          ) : multiple ? (
            "Cerca per nome oppure apri una categoria: puoi sceglierne quante vuoi."
          ) : (
            "Cerca per nome oppure apri una categoria."
          )}
        </p>
      )}
    </div>
  );
}
