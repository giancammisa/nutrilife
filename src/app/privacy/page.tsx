import Link from "next/link";
import { PRIVACY_VERSION } from "@/lib/auth";

export const metadata = { title: "Informativa privacy · NutriLife" };

// BOZZA: testo provvisorio, da far rivedere a un consulente privacy prima della fase di prova.
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="w-fit rounded-full bg-warning/15 px-3 py-1 text-sm text-foreground">
        Bozza in revisione · versione {PRIVACY_VERSION}
      </p>
      <h1 className="text-4xl font-extrabold">Informativa privacy</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">Chi tratta i dati</h2>
        <p>NutriLife, Altamura (BA). I dati di contatto completi del titolare saranno indicati qui.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">Quali dati raccogliamo</h2>
        <ul className="list-disc pl-5">
          <li>Email, nome e cognome, telefono (facoltativo).</li>
          <li>I pasti tipo indicati dal tuo nutrizionista: basi e grammature.</li>
          <li>Gli ordini, il pacchetto e la gastronomia scelta.</li>
          <li>Allergie e intolleranze, solo se le indichi, per evitare ordini pericolosi.</li>
        </ul>
        <p>
          Non raccogliamo anamnesi, peso, esami né il piano alimentare completo.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">Perché</h2>
        <p>
          Per permettere alla gastronomia di preparare e pesare i tuoi pasti, al nutrizionista di
          impostare i pasti tipo e a te di ordinarli e ritirarli.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">Chi li vede</h2>
        <p>
          Tu vedi i tuoi dati. Il tuo nutrizionista vede solo i suoi pazienti. La gastronomia vede
          solo gli ordini che deve preparare. I dati sono conservati su server nell&apos;Unione
          Europea.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">I tuoi diritti</h2>
        <p>
          Puoi chiedere in ogni momento di vedere, correggere o cancellare i tuoi dati e ritirare
          il consenso.
        </p>
      </section>

      <Link href="/" className="text-primary underline">
        Torna a NutriLife
      </Link>
    </main>
  );
}
