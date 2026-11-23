import { PlainShell } from "@/components/plain-shell";
import { notFound } from "next/navigation";
import { TestLoginForm } from "./test-login-form";

export const metadata = { title: "Accesso di prova · NutriLife" };

// SOLO SVILUPPO: nel sito online questa pagina non esiste.
export default function AccessoProvaPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <PlainShell>
      <div className="flex flex-col gap-2">
        <p className="w-fit rounded-full bg-warning/15 px-3 py-1 text-sm">Solo in prova, non online</p>
        <h1 className="text-[2.4rem]">Accesso di prova</h1>
        <p className="text-muted-foreground">
          Per gli utenti di prova creati da Supabase con una password (nutrizionista, paziente,
          cucina).
        </p>
      </div>
      <TestLoginForm />
    </PlainShell>
  );
}
