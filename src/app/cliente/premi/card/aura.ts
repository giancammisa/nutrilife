// Grafiche della card "I miei progressi" (disegni originali NutriLife, SVG).

export const INK = "#0B0B0B";
export const CREAM = "#F3EEE6";
export const LIME = "#EDFF8C";
export const SAGE = "#9EE6A0";
export const ROSE = "#F4B3AC";

// Sfondo "aura": macchie di colore sfocate e una sagoma umana morbida.
// La luce al centro del petto cresce con i progressi (0..1).
export function auraSvg(progress: number): string {
  const glow = 150 + Math.round(progress * 170);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<defs>
  <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="70"/></filter>
  <filter id="body" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
  <linearGradient id="fig" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="#8FD6BE"/>
    <stop offset="0.32" stop-color="#FF9A78"/>
    <stop offset="0.55" stop-color="#FFB98E"/>
    <stop offset="0.8" stop-color="#6FCBA6"/>
    <stop offset="1" stop-color="#B8E3CC"/>
  </linearGradient>
  <linearGradient id="head" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9ADBC4"/>
    <stop offset="1" stop-color="#C7D9B0"/>
  </linearGradient>
  <radialGradient id="glow">
    <stop offset="0" stop-color="#FFF7B0"/>
    <stop offset="0.45" stop-color="${LIME}" stop-opacity="0.9"/>
    <stop offset="1" stop-color="${LIME}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="1080" height="1920" fill="${CREAM}"/>
<circle cx="250" cy="760" r="330" fill="#FFB49C" opacity="0.55" filter="url(#soft)"/>
<circle cx="860" cy="1180" r="190" fill="#FF8DB4" opacity="0.5" filter="url(#soft)"/>
<circle cx="560" cy="1720" r="460" fill="${SAGE}" opacity="0.55" filter="url(#soft)"/>
<circle cx="880" cy="420" r="230" fill="${ROSE}" opacity="0.35" filter="url(#soft)"/>
<g filter="url(#body)" opacity="0.92">
  <ellipse cx="540" cy="560" rx="104" ry="118" fill="url(#head)"/>
  <path d="M540 700 C 650 700 735 760 762 860 C 800 1000 812 1180 840 1380 C 870 1600 920 1800 960 1920 L 140 1920 C 180 1790 215 1600 245 1390 C 270 1190 282 1000 320 860 C 346 760 430 700 540 700 Z" fill="url(#fig)"/>
</g>
<circle cx="540" cy="970" r="${glow}" fill="url(#glow)" filter="url(#soft)"/>
</svg>`;
}

// Anello di avanzamento attorno al numero, con piccole stelline.
export function ringSvg(progress: number): string {
  const r = 290;
  const c = 2 * Math.PI * r;
  const dash = (c * Math.max(0.04, progress)).toFixed(1);
  const sparkle = (x: number, y: number, s: number) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -20 C 3 -5 5 -3 20 0 C 5 3 3 5 0 20 C -3 5 -5 3 -20 0 C -5 -3 -3 -5 0 -20 Z" fill="${INK}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="660" height="660" viewBox="0 0 660 660">
<circle cx="330" cy="330" r="${r}" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.75)" stroke-width="22"/>
<circle cx="330" cy="330" r="${r}" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round" stroke-dasharray="${dash} ${c.toFixed(1)}" transform="rotate(-90 330 330)"/>
${sparkle(590, 90, 1.4)}${sparkle(80, 560, 1)}${sparkle(610, 520, 0.7)}
</svg>`;
}

export const svgData = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
