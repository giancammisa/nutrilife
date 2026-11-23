// Sfondo "acqua" della prima pagina: macchie di verde chiaro, morbide e lente,
// che si muovono come luce sotto l'acqua. Solo CSS (transform), si ferma con "riduci movimento".
const BLOBS = [
  { cls: "water-a", color: "rgb(207 225 202 / 0.9)", size: "70vmax", left: "-20%", top: "-15%" },
  { cls: "water-b", color: "rgb(158 230 160 / 0.4)", size: "60vmax", left: "45%", top: "10%" },
  { cls: "water-c", color: "rgb(220 232 210 / 0.95)", size: "75vmax", left: "-10%", top: "45%" },
  { cls: "water-d", color: "rgb(190 235 170 / 0.45)", size: "55vmax", left: "55%", top: "60%" },
  { cls: "water-e", color: "rgb(255 255 255 / 0.6)", size: "40vmax", left: "20%", top: "25%" },
  { cls: "water-f", color: "rgb(158 230 160 / 0.3)", size: "45vmax", left: "60%", top: "85%" },
];

export function LivingBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-salvia">
      {BLOBS.map((b) => (
        <span
          key={b.cls}
          className={`water-blob ${b.cls}`}
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            top: b.top,
            background: `radial-gradient(closest-side, ${b.color}, transparent)`,
          }}
        />
      ))}
      {/* riflessi d'acqua: onde sottili che scorrono */}
      <span className="water-caustics" />
    </div>
  );
}
