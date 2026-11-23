import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";

// Pasto d'esempio per mostrare come NutriLife legge un piatto: non sono dati di un cliente.
const ESEMPIO = [
  { name: "Petto di pollo", grams: 150, color: "var(--rose)" },
  { name: "Riso basmati", grams: 80, color: "var(--lemon)" },
  { name: "Zucchine grigliate", grams: 200, color: "var(--sage)" },
];

const PASSI = [
  { n: "01", title: "Il nutrizionista", text: "prepara i tuoi pasti tipo, con basi e grammi.", bg: "bg-lemon" },
  { n: "02", title: "Tu scegli", text: "i giorni e la gastronomia, entro le 18:00 del giorno prima.", bg: "bg-mint" },
  { n: "03", title: "Ritiri", text: "il pasto già pesato, con l'etichetta degli allergeni.", bg: "bg-sky" },
];

export default function Home() {
  const max = Math.max(...ESEMPIO.map((i) => i.grams));

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/60 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-3">
          <Wordmark className="text-lg" />
          <Link href="/privacy" className="glass rounded-full px-3 py-1 text-xs font-medium hover:bg-white/15">
            Privacy
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pt-8 pb-12">
        <section className="flex flex-col gap-4">
          <h1 className="text-[3.4rem] leading-[0.95] sm:text-6xl">
            <span className="font-semibold">Cucina</span> 3.0
          </h1>
          <p className="max-w-[34ch] text-lg leading-snug text-muted-foreground">
            Il piano del tuo nutrizionista, <span className="text-foreground">cucinato e pesato al grammo</span>{" "}
            da una gastronomia di Altamura.
          </p>
        </section>

        {/* Il pasto in cerchi grandi, con la scheda di vetro sopra */}
        <section aria-labelledby="esempio" className="relative h-[19rem] overflow-hidden rounded-[32px] bg-[#141414]">
          <div aria-hidden className="absolute inset-0">
            {ESEMPIO.map((i, idx) => {
              const d = 90 + 120 * Math.sqrt(i.grams / max);
              const pos = [
                { left: "-8%", top: "-10%" },
                { left: "42%", top: "4%" },
                { left: "30%", top: "38%" },
              ][idx];
              return (
                <span
                  key={i.name}
                  className="absolute rounded-full"
                  style={{ width: d, height: d, background: i.color, ...pos }}
                />
              );
            })}
          </div>
          <div className="glass absolute inset-x-4 bottom-4 flex flex-col gap-2 rounded-[24px] !bg-ink/45 p-4">
            <div className="flex items-baseline justify-between">
              <h2 id="esempio" className="text-base">
                Pranzo tipo
              </h2>
              <span className="rounded-full bg-paper/90 px-2 py-0.5 text-[11px] font-semibold text-ink">esempio</span>
            </div>
            <ul className="flex flex-col gap-1">
              {ESEMPIO.map((i) => (
                <li key={i.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="size-2.5 rounded-full" style={{ background: i.color }} />
                    {i.name}
                  </span>
                  <span className="num">{i.grams} g</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <ol className="grid gap-3">
          {PASSI.map((p) => (
            <li key={p.n} className={`${p.bg} flex items-end justify-between gap-4 rounded-[28px] p-5 text-ink`}>
              <span className="flex flex-col gap-1">
                <span className="text-lg font-semibold">{p.title}</span>
                <span className="max-w-[26ch] text-sm leading-snug text-ink/75">{p.text}</span>
              </span>
              <span className="display text-5xl text-ink/80" aria-hidden>
                {p.n}
              </span>
            </li>
          ))}
        </ol>

        <Button asChild size="lg" className="mt-2 h-14 text-base">
          <Link href="/home">
            Accedi
            <span className="ml-1 inline-flex size-8 items-center justify-center rounded-full bg-ink text-paper">
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </Link>
        </Button>
      </main>
    </div>
  );
}
