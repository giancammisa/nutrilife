import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { ConsentForm } from "./consent-form";

export const metadata = { title: "Benvenuto · NutriLife" };

export default async function ConsensoPage() {
  const profile = await getProfile();
  if (!profile) redirect("/accedi");
  if (profile.privacy_consent_at) redirect("/home");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold">Benvenuto</h1>
        <p className="text-muted-foreground">
          Ancora un passo. Raccogliamo solo ciò che serve per preparare i tuoi pasti: niente
          esami, peso o piano alimentare completo.
        </p>
      </div>
      <ConsentForm defaultName={profile.full_name ?? ""} />
    </main>
  );
}
