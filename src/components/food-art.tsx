import Image from "next/image";

// Foto di cibo in controluce (fornite da Gianvito), usate qua e là come decorazione.
// Sempre aria-hidden; su schede chiare con mix-blend-multiply così il bianco sparisce.
export const FOTO = {
  "uva-rosa": { w: 736, h: 1270 },
  fico: { w: 736, h: 1313 },
  pompelmo: { w: 736, h: 920 },
  piselli: { w: 552, h: 706 },
  "pera-fichi": { w: 900, h: 1310 },
  cetriolo: { w: 900, h: 1201 },
  "uva-verde": { w: 736, h: 897 },
} as const;

export type FotoName = keyof typeof FOTO;

export function FoodPhoto({
  name,
  className,
  priority,
  sizes = "(max-width: 448px) 100vw, 448px",
}: {
  name: FotoName;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const { w, h } = FOTO[name];
  return (
    <Image
      src={`/immagini/${name}.webp`}
      alt=""
      aria-hidden
      width={w}
      height={h}
      sizes={sizes}
      priority={priority}
      draggable={false}
      className={`pointer-events-none select-none mix-blend-multiply ${className ?? ""}`}
    />
  );
}
