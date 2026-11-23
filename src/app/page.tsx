import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { FoodPhoto, type FotoName } from "@/components/food-art";
import { LivingBackground } from "@/components/living-background";
import { Button } from "@/components/ui/button";

// Pasto d'esempio per mostrare come NutriLife legge un piatto: non sono dati di un cliente.
const ESEMPIO = [
  { name: "Petto di pollo", grams: 150, color: "var(--rose)" },
  { name: "Riso basmati", grams: 80, color: "var(--lemon)" },
  { name: "Zucchine grigliate", grams: 200, color: "var(--sage)" },
];

const PASSI: { n: string; title: string; text: string; bg: string; foto: FotoName | null }[] = [
  { n: "01", title: "Il nutrizionista", text: "prepara i tuoi pasti tipo, con basi e grammi.", bg: "bg-grad-lime", foto: null },
  { n: "02", title: "Tu scegli", text: "i giorni e la gastronomia, entro le 18:00 del giorno prima.", bg: "bg-grad-leaf", foto: "piselli" },
  { n: "03", title: "Ritiri", text: "il pasto già pesato, con l'etichetta degli allergeni.", bg: "bg-grad-fog", foto: "pompelmo" },
];

export default function Home() {
  return (
    <div className="relative isolate flex flex-1 flex-col">
      <LivingBackground />
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-white/45 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-3">
          <Wordmark className="text-lg" />
          <Link href="/privacy" className="glass rounded-full px-3 py-1 text-xs font-medium hover:bg-white/90">
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

        {/* Il pasto in controluce su verde leggero, con la scheda di vetro sopra */}
        <section aria-labelledby="esempio" className="bg-grad-leaf relative h-[21rem] overflow-hidden rounded-[32px]">
          <FoodPhoto name="cetriolo" priority className="absolute inset-0 h-full w-full object-cover object-top" />
          <div className="absolute inset-x-4 bottom-4 flex flex-col gap-2 rounded-[24px] border border-white/15 bg-ink/75 p-4 text-paper backdrop-blur-2xl">
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
            <li key={p.n} className={`${p.bg} relative flex items-end justify-between gap-4 overflow-hidden rounded-[28px] p-5 text-ink`}>
              {p.foto && (
                <FoodPhoto
                  name={p.foto}
                  sizes="160px"
                  className="absolute inset-y-0 right-0 h-full w-40 object-cover opacity-75 [mask-image:linear-gradient(to_left,black_45%,transparent)]"
                />
              )}
              <span className="relative flex flex-col gap-1">
                <span className="text-lg font-semibold">{p.title}</span>
                <span className="max-w-[22ch] text-sm leading-snug text-ink/75">{p.text}</span>
              </span>
              <span className="display relative text-5xl text-ink" aria-hidden>
                {p.n}
              </span>
            </li>
          ))}
        </ol>

        <Button asChild size="lg" className="mt-2 h-14 text-base">
          <Link href="/home">
            Accedi
            <span className="ml-1 inline-flex size-8 items-center justify-center rounded-full bg-lemon text-ink">
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </Link>
        </Button>
      </main>
    </div>
  );
}
