import Link from "next/link";
import { PRIVACY_VERSION } from "@/lib/auth";

export const metadata = { title: "Informativa privacy · NutriLife" };

// BOZZA: testo scritto in base a cosa fa davvero l'app (v1), da far rivedere a un consulente
// privacy prima di aprire NutriLife ai pazienti. Le parti [tra parentesi quadre] vanno completate.
// Se il testo cambia, aumentare PRIVACY_VERSION in src/lib/auth.ts: tutti ridaranno il consenso.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="w-fit rounded-full bg-warning/15 px-3 py-1 text-sm text-foreground">
        Bozza in revisione · versione {PRIVACY_VERSION}
      </p>
      <h1 className="text-[2.4rem]">Informativa privacy</h1>
      <p className="text-muted-foreground">
        NutriLife fa preparare da una gastronomia di Altamura i pasti indicati dal tuo nutrizionista.
        Qui spieghiamo quali dati usiamo, perché e chi li vede.
      </p>

      <Section title="Chi è il titolare">
        <p>
          [Ragione sociale di NutriLife], [indirizzo], Altamura (BA). Contatto per la privacy:{" "}
          [email dedicata].
        </p>
      </Section>

      <Section title="Quali dati raccogliamo">
        <ul className="list-disc pl-5">
          <li>
            <strong>Dati di accesso e contatto:</strong> email, nome e cognome, telefono (facoltativo).
          </li>
          <li>
            <strong>Pasti tipo:</strong> le basi e le grammature che il tuo nutrizionista inserisce
            per te.
          </li>
          <li>
            <strong>Ordini:</strong> giorno, pasto, gastronomia, prezzo e stato (confermato, pronto,
            ritirato, annullato).
          </li>
          <li>
            <strong>Allergie e intolleranze</strong> (dati relativi alla salute), solo se decidi di
            indicarle e con un consenso a parte: servono a bloccare gli ordini che contengono un tuo
            allergene.
          </li>
          <li>
            <strong>Consensi:</strong> data e versione dell&apos;informativa che hai accettato.
          </li>
        </ul>
        <p>
          Non raccogliamo anamnesi, peso, misure, esami né il piano alimentare completo, che resta
          al tuo nutrizionista.
        </p>
      </Section>

      <Section title="Perché li usiamo e su quale base">
        <ul className="list-disc pl-5">
          <li>Per farti accedere e preparare i pasti che ordini (esecuzione del servizio).</li>
          <li>
            Per controllare gli allergeni dei tuoi ordini (tuo consenso esplicito, che puoi ritirare
            in ogni momento dalla pagina “Le mie allergie”).
          </li>
          <li>Per gli obblighi di legge collegati alla vendita, quando previsti.</li>
        </ul>
        <p>Non usiamo i tuoi dati per pubblicità e non li vendiamo.</p>
      </Section>

      <Section title="Chi li vede">
        <ul className="list-disc pl-5">
          <li>
            <strong>Tu:</strong> tutti i tuoi dati.
          </li>
          <li>
            <strong>Il tuo nutrizionista:</strong> il tuo nome, la tua email, le allergie che hai
            indicato e i pasti tipo che prepara per te. Non vede i tuoi ordini.
          </li>
          <li>
            <strong>La gastronomia che scegli:</strong> solo il tuo nome e cosa preparare (basi,
            grammi, allergeni del pasto) per gli ordini fatti da lei. Non vede email, telefono né
            le tue allergie personali.
          </li>
          <li>
            <strong>NutriLife (amministrazione):</strong> per gestire il servizio e l&apos;assistenza.
          </li>
        </ul>
      </Section>

      <Section title="Dove sono conservati">
        <p>
          I dati sono conservati da fornitori che agiscono per nostro conto: Supabase (database e
          accesso, server nell&apos;Unione Europea, Francoforte), Resend (invio delle email con il
          codice di accesso) e Vercel (pubblicazione dell&apos;app). [Da verificare con il consulente:
          accordi di trattamento e trasferimenti fuori UE dei fornitori.]
        </p>
      </Section>

      <Section title="Per quanto tempo">
        <p>
          Finché usi NutriLife. Se chiedi di chiudere l&apos;account cancelliamo i tuoi dati, salvo
          quelli che la legge ci obbliga a tenere più a lungo. [Periodi precisi da definire.]
        </p>
      </Section>

      <Section title="I tuoi diritti">
        <p>
          Puoi chiedere di vedere, correggere o cancellare i tuoi dati, limitarne l&apos;uso, riceverne
          una copia e ritirare il consenso, scrivendo a [email dedicata]. Puoi anche rivolgerti al
          Garante per la protezione dei dati personali (garanteprivacy.it).
        </p>
      </Section>

      <Link href="/" className="text-primary underline">
        Torna a NutriLife
      </Link>
    </main>
  );
}
