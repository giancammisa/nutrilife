"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ArcDay = {
  date: string;
  label: string; // "Oggi", "Domani", "Sabato"
  weekday: string; // "mer"
  dayNum: string; // "25"
  title: string; // "Mercoledì 25 novembre"
  note: string; // "Ordini entro …" o "Ordini chiusi"
  ordered: boolean;
  open: boolean;
};

const ITEM = 76; // diametro del bollino del giorno
const GAP = 16;
const BAND = 98; // spessore del banner: poco più del bollino al centro (76 × 1.14 ≈ 87)
const DEPTH = BAND / 2; // i bollini stanno a metà della fascia
const TOP = 12; // spazio sopra il banner

// Banner di vetro ad arco (una grande ciambella vista dall'alto) su fondo piatto:
// i bollini dei giorni scorrono lungo l'arco, quello al centro è più grande ed è il giorno scelto.
// Sotto, dentro l'arco, compare il dettaglio del giorno (ordini o pulsante Ordina).
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
  const [width, setWidth] = useState(375);
  const wrap = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<number | null>(null);

  const R = Math.round(width * 1.4); // raggio esterno del banner
  const track = R - DEPTH; // raggio su cui stanno i centri dei bollini

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Posa ogni bollino sull'arco e lo ingrandisce verso il centro.
  const layout = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    items.current.forEach((b, i) => {
      if (!b) return;
      const x = b.offsetLeft + b.offsetWidth / 2 - mid;
      const cx = Math.min(Math.abs(x), track * 0.95);
      const drop = track - Math.sqrt(track * track - cx * cx);
      const t = Math.min(1, Math.abs(x) / (el.clientWidth / 2));
      const scale = 1.14 - t * 0.3; // 1.14 al centro, 0.84 ai lati
      b.style.transform = `translateY(${drop.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      b.style.zIndex = String(100 - Math.round(t * 50));
      if (Math.abs(x) < best) {
        best = Math.abs(x);
        nearest = i;
      }
    });
    return nearest;
  }, [track]);

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

  useEffect(() => {
    layout();
  }, [width, layout]);

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
  const inner = R - BAND;

  return (
    <section
      ref={wrap}
      className="relative -mx-5 overflow-hidden rounded-b-[36px] sm:mx-0"
      aria-label="Giorni della settimana"
    >
      {/* il banner: anello esterno di vetro chiaro, interno un po' più scuro */}
      <div
        aria-hidden
        className="glass absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{ top: TOP, width: R * 2, height: R * 2 }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 rounded-full border-t border-white/90 bg-salvia-deep"
        style={{ top: TOP + BAND, width: inner * 2, height: inner * 2 }}
      />

      <div
        ref={scroller}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        role="tablist"
        aria-label="Scegli il giorno"
        className="relative flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          gap: GAP,
          paddingInline: `calc(50% - ${ITEM / 2}px)`,
          paddingTop: TOP + DEPTH - ITEM / 2,
          height: TOP + BAND + 44,
        }}
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
              className="relative flex shrink-0 snap-center flex-col items-center gap-1.5 self-start outline-none"
              style={{ width: ITEM, transformOrigin: `50% ${ITEM / 2}px` }}
            >
              <span
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-full leading-none transition-colors duration-150",
                  d.ordered ? "bg-grad-lime text-ink" : "border border-white bg-white text-ink",
                  !d.open && !d.ordered && "opacity-60",
                  active && "outline-2 outline-offset-3 outline-ink",
                )}
                style={{ width: ITEM, height: ITEM }}
              >
                <span className="text-[11px] font-semibold uppercase text-ink/55">{d.weekday}</span>
                <span className="display text-[1.85rem]">{d.dayNum}</span>
                {d.ordered && (
                  <span className="absolute top-0 right-0 inline-flex size-6 items-center justify-center rounded-full bg-ink text-paper">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                )}
              </span>
              <span className={cn("text-xs whitespace-nowrap", active ? "text-sm font-semibold" : "text-muted-foreground")}>
                {d.label}
              </span>
              <span className="sr-only">{d.ordered ? ", già ordinato" : d.open ? "" : ", ordini chiusi"}</span>
            </button>
          );
        })}
      </div>

      {/* segno sotto il giorno scelto, sul bordo interno dell'arco */}
      <span
        aria-hidden
        className="absolute left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-ink"
        style={{ top: TOP + BAND + 36 }}
      />

      <div
        id="giorno-dettaglio"
        role="tabpanel"
        aria-labelledby={`giorno-${day.date}`}
        className="relative flex flex-col gap-3 px-6 pt-6 pb-7"
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
