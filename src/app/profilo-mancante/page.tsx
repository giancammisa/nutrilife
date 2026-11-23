import { redirect } from "next/navigation";
import { getProfile, getUserId } from "@/lib/auth";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Profilo non trovato · NutriLife" };

// Accesso riuscito ma nessun profilo nel database: di solito le tabelle non sono ancora state create.
export default async function ProfiloMancantePage() {
  if (!(await getUserId())) redirect("/accedi");
  if (await getProfile()) redirect("/home");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-extrabold">Accesso riuscito, profilo non trovato</h1>
      <p className="text-muted-foreground">
        Sei entrato correttamente, ma il tuo profilo non è ancora nel database. Di solito
        significa che le tabelle di NutriLife non sono state ancora create su Supabase.
      </p>
      <p className="text-muted-foreground">
        Dopo aver eseguito i comandi SQL su Supabase, ricarica questa pagina.
      </p>
      <form action={signOut}>
        <Button type="submit" className="rounded-full">
          Esci
        </Button>
      </form>
    </main>
  );
}
