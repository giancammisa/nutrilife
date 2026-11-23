import { PlainShell } from "@/components/plain-shell";
import { redirect } from "next/navigation";
import { getProfile, hasCurrentConsent } from "@/lib/auth";
import { ConsentForm } from "./consent-form";

export const metadata = { title: "Benvenuto · NutriLife" };

export default async function ConsensoPage() {
  const profile = await getProfile();
  if (!profile) redirect("/accedi");
  if (hasCurrentConsent(profile)) redirect("/home");

  // Aveva già dato il consenso su una versione precedente dell'informativa.
  const updated = Boolean(profile.privacy_consent_at);

  return (
    <PlainShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-[2.4rem]">{updated ? "Informativa aggiornata" : "Benvenuto"}</h1>
        <p className="text-muted-foreground">
          {updated
            ? "Abbiamo aggiornato l'informativa privacy. Leggila e conferma per continuare a usare NutriLife."
            : "Ancora un passo. Raccogliamo solo ciò che serve per preparare i tuoi pasti: niente esami, peso o piano alimentare completo."}
        </p>
      </div>
      <ConsentForm defaultName={profile.full_name ?? ""} />
    </PlainShell>
  );
}
