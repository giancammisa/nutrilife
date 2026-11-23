import { cn } from "@/lib/utils";

// Segno NutriLife: tre cerchi che si fondono in uno solo — le tre famiglie di basi del menu
// componibile (proteina, carboidrato, verdura) che diventano un pasto. Disegno originale.
// La fusione è un filtro "goo": sfocatura + soglia dell'alfa sulla silhouette.

function GooFilter({ id, blur }: { id: string; blur: number }) {
  return (
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="b" />
      <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
    </filter>
  );
}

export function LogoMark({ className, title = "NutriLife" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("shrink-0", className)} role="img" aria-label={title}>
      <defs>
        <GooFilter id="nl-mark-goo" blur={6.5} />
      </defs>
      <g filter="url(#nl-mark-goo)" fill="currentColor">
        <circle cx="35" cy="62" r="26" />
        <circle cx="69" cy="31" r="17" />
        <circle cx="78" cy="71" r="13" />
      </g>
    </svg>
  );
}

// Il segno grande e animato (prima pagina): i tre cerchi nei colori del pasto — proteina rosa,
// carboidrato lime, verdura verde — con la silhouette nera fusa sotto. I cerchi si allontanano
// e si riavvicinano piano, e la silhouette li tiene uniti. Fermo con "riduci movimento".
const MARK = [
  { cx: 35, cy: 62, r: 26, fill: "var(--sage)", anim: "mark-a" },
  { cx: 69, cy: 31, r: 17, fill: "var(--lemon)", anim: "mark-b" },
  { cx: 78, cy: 71, r: 13, fill: "var(--rose)", anim: "mark-c" },
];

export function AnimatedMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-6 -6 112 112" className={cn("shrink-0 overflow-visible", className)} aria-hidden>
      <defs>
        <GooFilter id="nl-mark-live" blur={6} />
      </defs>
      <g filter="url(#nl-mark-live)" fill="var(--ink)">
        {MARK.map((c) => (
          <circle key={c.anim} className={`mark-dot ${c.anim}`} cx={c.cx} cy={c.cy} r={c.r + 3.5} />
        ))}
      </g>
      {MARK.map((c) => (
        <circle key={c.anim} className={`mark-dot ${c.anim}`} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill} />
      ))}
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold leading-none tracking-[-0.02em]", className)}>
      <LogoMark className="size-[1.4em]" title="" />
      <span>NutriLife</span>
    </span>
  );
}

// ── Il pasto in cerchi fusi ─────────────────────────────
// Un cerchio per famiglia di basi, area proporzionale ai grammi veri, fusi in un'unica forma.

const CATEGORY_FILL: Record<string, string> = {
  proteina: "var(--rose)",
  carboidrato: "var(--lemon)",
  verdura: "var(--sage)",
  altro: "var(--sky)",
};

const CATEGORY_ORDER = ["proteina", "carboidrato", "verdura", "altro"];
const CATEGORY_NAME: Record<string, string> = {
  proteina: "proteine",
  carboidrato: "carboidrati",
  verdura: "verdure",
  altro: "altro",
};

export function MealBlob({
  items,
  size = 56,
  outline = "var(--ink)",
  className,
}: {
  items: { category: string; grams: number }[];
  size?: number;
  /** colore della silhouette fusa: chiaro su fondo scuro, "var(--ink)" su schede chiare */
  outline?: string;
  className?: string;
}) {
  const totals = CATEGORY_ORDER.map((c) => ({
    category: c,
    grams: items.filter((i) => i.category === c).reduce((s, i) => s + i.grams, 0),
  })).filter((t) => t.grams > 0);

  if (totals.length === 0) return null;

  const max = Math.max(...totals.map((t) => t.grams));
  const H = 100;
  const maxR = 42;
  // raggio ∝ √grammi (l'area racconta il peso), con un minimo perché resti leggibile
  const circles = totals.map((t) => ({ ...t, r: Math.max(13, maxR * Math.sqrt(t.grams / max)) }));
  // in fila, quasi a contatto: il filtro crea un "collo" morbido tra un cerchio e l'altro
  const placed = circles.reduce<(typeof circles[number] & { cx: number; cy: number })[]>((acc, c, i) => {
    const prev = acc[i - 1];
    const cx = prev ? prev.cx + prev.r + c.r + 3 : 6 + c.r;
    return [...acc, { ...c, cx, cy: H / 2 }];
  }, []);
  const W = Math.max(...placed.map((c) => c.cx + c.r)) + 6;
  const id = `nl-meal-goo-${placed.map((c) => `${c.category[0]}${Math.round(c.r)}`).join("")}`;
  const label = `Composizione: ${totals.map((t) => `${t.grams} g di ${CATEGORY_NAME[t.category]}`).join(", ")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      height={size}
      width={(size * W) / H}
      className={cn("shrink-0 overflow-visible", className)}
      role="img"
      aria-label={label}
    >
      <defs>
        <GooFilter id={id} blur={5} />
      </defs>
      {/* silhouette: i cerchi un po' più grandi, fusi */}
      <g filter={`url(#${id})`} fill={outline}>
        {placed.map((c) => (
          <circle key={c.category} cx={c.cx} cy={c.cy} r={c.r + 3.2} />
        ))}
      </g>
      {/* cerchi colorati, nitidi */}
      {placed.map((c) => (
        <circle key={c.category} cx={c.cx} cy={c.cy} r={c.r} fill={CATEGORY_FILL[c.category]} />
      ))}
    </svg>
  );
}

// Legenda compatta per chi non legge i colori: sempre accanto al disegno dove serve.
export function MealLegend({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", className)}>
      {CATEGORY_ORDER.slice(0, 3).map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ background: CATEGORY_FILL[c] }}
          />
          {CATEGORY_NAME[c]}
        </span>
      ))}
    </span>
  );
}
