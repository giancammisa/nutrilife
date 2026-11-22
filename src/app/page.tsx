import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Pagina provvisoria del passo 1: serve solo a verificare grafica e pubblicazione.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <Badge variant="secondary" className="w-fit uppercase tracking-[0.2em]">
        In costruzione
      </Badge>

      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-extrabold">NutriLife</h1>
        <p className="text-2xl font-light text-primary">Dimmelo prima.</p>
      </div>

      <p className="text-lg text-muted-foreground">
        Il piano del tuo nutrizionista, cucinato e pesato dalla gastronomia di
        Altamura. Ordini entro le 18:00, ritiri il giorno dopo.
      </p>

      <div className="rounded-lg border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Come funziona
        </p>
        <ol className="mt-3 flex flex-col gap-2 text-card-foreground">
          <li>1. Il nutrizionista prepara i tuoi pasti tipo.</li>
          <li>2. Scegli i giorni e la gastronomia.</li>
          <li>3. Ritiri il pasto già pesato.</li>
        </ol>
      </div>

      <Button asChild size="lg" className="h-12 rounded-full text-base">
        <Link href="/home">Accedi</Link>
      </Button>
    </main>
  );
}
