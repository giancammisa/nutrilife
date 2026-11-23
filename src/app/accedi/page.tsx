import { FoodPhoto } from "@/components/food-art";
import { LivingBackground } from "@/components/living-background";
import { PlainShell } from "@/components/plain-shell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, getUserId } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Accedi · NutriLife" };

export default async function AccediPage({ searchParams }: PageProps<"/accedi">) {
  if (await getProfile()) redirect("/home");
  if (await getUserId()) redirect("/profilo-mancante");

  const { errore } = await searchParams;
  const initialError =
    errore === "link"
      ? "Il link è scaduto o è stato aperto su un altro dispositivo. Chiedi un nuovo codice da qui."
      : null;

  return (
    <PlainShell>
      <LivingBackground />
      <div className="bg-grad-fog relative -mb-2 h-36 overflow-hidden rounded-[28px]">
        <FoodPhoto name="pera-fichi" priority className="absolute inset-0 h-full w-full object-cover object-[50%_30%]" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-[2.4rem]">Accedi</h1>
        <p className="text-muted-foreground">Bentornato su NutriLife.</p>
      </div>
      <LoginForm initialError={initialError} />
      {/* SOLO SVILUPPO: scorciatoia per gli utenti di prova con password */}
      {process.env.NODE_ENV === "development" && (
        <Link
          href="/accedi/prova"
          className="glass w-fit self-center rounded-full px-4 py-2 text-sm font-medium hover:bg-white/90"
        >
          Account di prova (con password)
        </Link>
      )}
    </PlainShell>
  );
}
