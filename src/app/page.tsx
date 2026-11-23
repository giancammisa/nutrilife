import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark, MealBlob, MealLegend } from "@/components/brand";
import { Button } from "@/components/ui/button";

// Pasto d'esempio per mostrare come NutriLife legge un piatto: non sono dati di un cliente.
const ESEMPIO = [
  { name: "Petto di pollo", category: "proteina", grams: 150 },
  { name: "Riso basmati", category: "carboidrato", grams: 80 },
  { name: "Zucchine grigliate", category: "verdura", grams: 200 },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-lemon text-ink">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 px-6 pt-10 pb-12">
        <header className="flex items-center justify-between">
          <span className="display text-lg">NutriLife</span>
          <Link href="/privacy" className="text-sm font-medium underline-offset-4 hover:underline">
            Privacy
          </Link>
        </header>

        <section className="flex flex-col gap-6">
          <LogoMark className="size-24" title="" />
          <h1 className="text-[3.6rem] leading-[0.9] sm:text-7xl">
            Cucina
            <br />
            3.0
          </h1>
          <p className="max-w-[32ch] text-lg leading-snug">
            Il piano del tuo nutrizionista, cucinato e pesato al grammo da una gastronomia di
            Altamura. Ordini entro le 18:00, ritiri il giorno dopo.
          </p>
        </section>

        <section aria-labelledby="esempio" className="flex flex-col gap-4 rounded-[14px] bg-ink p-5 text-paper">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="esempio" className="text-lg text-lemon">
              Pranzo tipo
            </h2>
            <span className="text-xs text-paper/70">esempio</span>
          </div>
          <div className="flex justify-center rounded-[10px] bg-paper px-3 py-4">
            <MealBlob items={ESEMPIO} size={96} />
          </div>
          <ul className="flex flex-col gap-1.5">
            {ESEMPIO.map((i) => (
              <li key={i.name} className="flex items-baseline justify-between gap-3">
                <span>{i.name}</span>
                <span className="num text-lemon">{i.grams} g</span>
              </li>
            ))}
          </ul>
          <MealLegend className="text-paper/70 [&_span_span]:ring-paper" />
        </section>

        <ol className="flex flex-col gap-3">
          {[
            "Il nutrizionista prepara i tuoi pasti tipo.",
            "Scegli i giorni e la gastronomia.",
            "Ritiri il pasto già pesato, con le etichette degli allergeni.",
          ].map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="display flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm text-lemon">
                {i + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>

        <Button asChild size="lg" className="mt-auto h-14 text-base">
          <Link href="/home">
            Accedi
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </Button>
      </div>
    </main>
  );
}
