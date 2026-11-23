"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ArcDay = {
  date: string;
  label: string; // "Oggi", "Domani", "Sabato"
  weekday: string; // "mer"
  dayNum: string; // "25"
  title: string; // "Mercoledì 25 novembre"
  note: string; // "entro martedì 24 novembre alle 18:00" o "ordini chiusi"
  ordered: boolean;
  open: boolean;
};

const ITEM = 64; // diametro del cerchio del giorno
const GAP = 14;
const LIFT = 22; // quanto scendono i giorni ai lati, lungo l'arco

// Nastro dei giorni su un arco di vetro: si scorre col dito, il giorno al centro è quello scelto
// e sotto compare il suo dettaglio (ordini o pulsante Ordina).
export function DayArc({
  days,
  panels,
  initial = 0,
}: {
  days: ArcDay[];
  panels: React.ReactNode[];
  initial?: number;
}) {
  const [selected, setSelected] = useState(initial);
  const scroller = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<number | null>(null);

  // Posa ogni giorno sull'arco in base alla distanza dal centro.
  const layout = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    const half = el.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    items.current.forEach((b, i) => {
      if (!b) return;
      const center = b.offsetLeft + b.offsetWidth / 2;
      const d = Math.max(-1.4, Math.min(1.4, (center - mid) / half));
      b.style.transform = `translateY(${(d * d * LIFT).toFixed(1)}px) scale(${(1 - Math.abs(d) * 0.1).toFixed(3)})`;
      if (Math.abs(center - mid) < best) {
        best = Math.abs(center - mid);
        nearest = i;
      }
    });
    return nearest;
  }, []);

  const centerOn = useCallback((i: number, smooth = true) => {
    const el = scroller.current;
    const b = items.current[i];
    if (!el || !b) return;
    el.scrollTo({ left: b.offsetLeft + b.offsetWidth / 2 - el.clientWidth / 2, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    centerOn(initial, false);
    layout();
  }, [initial, centerOn, layout]);

  function onScroll() {
    if (frame.current == null) {
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        layout();
      });
    }
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const n = layout();
      if (n != null) setSelected(n);
    }, 110);
  }

  function choose(i: number) {
    setSelected(i);
    centerOn(i);
    items.current[i]?.focus({ preventScroll: true });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") choose(Math.min(days.length - 1, selected + 1));
    else if (e.key === "ArrowLeft") choose(Math.max(0, selected - 1));
    else return;
    e.preventDefault();
  }

  const day = days[selected];

  return (
    <section className="day-arc glass relative -mx-5 overflow-hidden pb-6 sm:mx-0" aria-label="Giorni della settimana">
      <div
        ref={scroller}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        role="tablist"
        aria-label="Scegli il giorno"
        className="flex snap-x snap-mandatory overflow-x-auto pt-7 pb-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: GAP, paddingInline: `calc(50% - ${ITEM / 2}px)` }}
      >
        {days.map((d, i) => {
          const active = i === selected;
          return (
            <button
              key={d.date}
              ref={(b) => {
                items.current[i] = b;
              }}
              type="button"
              role="tab"
              id={`giorno-${d.date}`}
              aria-selected={active}
              aria-controls="giorno-dettaglio"
              tabIndex={active ? 0 : -1}
              onClick={() => choose(i)}
              className="flex shrink-0 snap-center flex-col items-center gap-2 transition-transform duration-150 ease-out outline-none"
              style={{ width: ITEM }}
            >
              <span
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-full leading-none transition-colors duration-150",
                  d.ordered
                    ? "bg-grad-lime text-ink"
                    : "border border-white/90 bg-white/70 text-ink",
                  !d.open && !d.ordered && "opacity-55",
                  active && "ring-2 ring-ink ring-offset-2 ring-offset-transparent",
                )}
                style={{ width: ITEM, height: ITEM }}
              >
                <span className="text-[11px] font-semibold uppercase text-ink/60">{d.weekday}</span>
                <span className="display text-[1.6rem]">{d.dayNum}</span>
                {d.ordered && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex size-5 items-center justify-center rounded-full bg-ink text-paper">
                    <Check className="size-3" aria-hidden />
                  </span>
                )}
              </span>
              <span className={cn("text-xs whitespace-nowrap", active ? "font-semibold" : "text-muted-foreground")}>
                {d.label}
              </span>
              <span className="sr-only">{d.ordered ? ", già ordinato" : d.open ? "" : ", ordini chiusi"}</span>
            </button>
          );
        })}
      </div>

      {/* segno sotto il giorno scelto */}
      <span aria-hidden className="absolute top-[8.1rem] left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-ink" />

      <div
        id="giorno-dettaglio"
        role="tabpanel"
        aria-labelledby={`giorno-${day.date}`}
        className="flex flex-col gap-3 px-6"
      >
        <div className="flex flex-col">
          <h2 className="text-xl first-letter:uppercase">{day.title}</h2>
          <span className="text-xs text-muted-foreground">{day.note}</span>
        </div>
        {panels[selected]}
      </div>
    </section>
  );
}
