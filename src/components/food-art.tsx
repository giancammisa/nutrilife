// Illustrazioni originali NutriLife "in controluce": cibo tagliato sottile e traslucido,
// come visto contro una finestra. Solo decorazione (aria-hidden), nessun dato.
// Sono pensate per stare su schede chiare (verde leggero o grigio) con mix-blend-multiply.

type ArtProps = { className?: string };

export function CucumberSlices({ className }: ArtProps) {
  const slices = [
    { cx: 70, cy: 70, r: 52 },
    { cx: 150, cy: 52, r: 40 },
    { cx: 128, cy: 132, r: 48 },
    { cx: 52, cy: 158, r: 34 },
  ];
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <radialGradient id="cuc-flesh" cx="50%" cy="45%" r="55%">
          <stop offset="0" stopColor="#F3F8E4" />
          <stop offset="0.7" stopColor="#D5E6B4" />
          <stop offset="1" stopColor="#9CBF74" />
        </radialGradient>
      </defs>
      {slices.map((s, i) => (
        <g key={i} opacity={0.86}>
          <circle cx={s.cx} cy={s.cy} r={s.r} fill="#5E8A3A" />
          <circle cx={s.cx} cy={s.cy} r={s.r * 0.9} fill="url(#cuc-flesh)" />
          <circle cx={s.cx} cy={s.cy} r={s.r * 0.42} fill="#E9F2D2" stroke="#A9C886" strokeWidth={1} />
          {Array.from({ length: 9 }).map((_, k) => {
            const a = (k / 9) * Math.PI * 2;
            const d = s.r * 0.3;
            return (
              <ellipse
                key={k}
                cx={s.cx + Math.cos(a) * d}
                cy={s.cy + Math.sin(a) * d}
                rx={s.r * 0.06}
                ry={s.r * 0.11}
                transform={`rotate(${(a * 180) / Math.PI + 90} ${s.cx + Math.cos(a) * d} ${s.cy + Math.sin(a) * d})`}
                fill="#C2D99E"
                opacity={0.9}
              />
            );
          })}
        </g>
      ))}
      <circle cx={92} cy={46} r={4} fill="#fff" opacity={0.7} />
      <circle cx={140} cy={118} r={2.6} fill="#fff" opacity={0.7} />
    </svg>
  );
}

export function CitrusSegment({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="cit-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F8C9A0" />
          <stop offset="0.55" stopColor="#EE8F62" />
          <stop offset="1" stopColor="#C9583A" />
        </linearGradient>
      </defs>
      <path
        d="M40 150 C 30 80, 90 20, 160 34 C 178 38, 182 56, 170 70 C 140 104, 110 140, 70 168 C 56 176, 42 168, 40 150 Z"
        fill="url(#cit-body)"
        opacity={0.88}
      />
      {Array.from({ length: 16 }).map((_, k) => {
        const t = k / 15;
        return (
          <path
            key={k}
            d={`M ${64 + t * 10} ${150 - t * 6} Q ${90 + t * 40} ${100 - t * 30}, ${120 + t * 44} ${56 + t * 6}`}
            stroke="#FFE3CC"
            strokeWidth={1.2}
            fill="none"
            opacity={0.55}
          />
        );
      })}
      <path d="M48 148 C 44 96, 92 44, 158 42" stroke="#FFF2E6" strokeWidth={3} fill="none" opacity={0.6} />
    </svg>
  );
}

export function PeaPod({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 220" className={className} aria-hidden>
      <defs>
        <linearGradient id="pea-pod" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7FA24A" />
          <stop offset="0.5" stopColor="#CFE39A" />
          <stop offset="1" stopColor="#7FA24A" />
        </linearGradient>
      </defs>
      <path d="M60 8 C 92 40, 96 150, 60 212 C 24 150, 28 40, 60 8 Z" fill="url(#pea-pod)" opacity={0.82} />
      {[46, 74, 102, 130, 158].map((y, i) => (
        <g key={y}>
          <circle cx={60} cy={y} r={11 - Math.abs(i - 2) * 0.8} fill="#4E6E25" opacity={0.85} />
          <circle cx={57} cy={y - 3} r={2.4} fill="#E8F3C8" opacity={0.6} />
        </g>
      ))}
      <path d="M60 14 L 60 206" stroke="#EEF6D2" strokeWidth={1.2} opacity={0.6} />
    </svg>
  );
}

export function Grapes({ className }: ArtProps) {
  const berries = [
    { cx: 92, cy: 64, r: 34 },
    { cx: 56, cy: 104, r: 32 },
    { cx: 124, cy: 108, r: 32 },
    { cx: 90, cy: 148, r: 30 },
  ];
  return (
    <svg viewBox="0 0 180 190" className={className} aria-hidden>
      <defs>
        <radialGradient id="grape" cx="40%" cy="38%" r="65%">
          <stop offset="0" stopColor="#E7F0C4" />
          <stop offset="0.55" stopColor="#A9BE6C" />
          <stop offset="1" stopColor="#3F5420" />
        </radialGradient>
      </defs>
      <path d="M92 30 C 94 18, 104 10, 116 6" stroke="#3A3A2A" strokeWidth={3} fill="none" strokeLinecap="round" />
      {berries.map((b, i) => (
        <g key={i} opacity={0.86}>
          <circle cx={b.cx} cy={b.cy} r={b.r} fill="url(#grape)" />
          <path
            d={`M ${b.cx - b.r * 0.5} ${b.cy + b.r * 0.1} Q ${b.cx} ${b.cy - b.r * 0.5}, ${b.cx + b.r * 0.5} ${b.cy + b.r * 0.2}`}
            stroke="#EEF5D6"
            strokeWidth={1.2}
            fill="none"
            opacity={0.5}
          />
          <circle cx={b.cx - b.r * 0.35} cy={b.cy - b.r * 0.35} r={b.r * 0.12} fill="#fff" opacity={0.75} />
        </g>
      ))}
    </svg>
  );
}
