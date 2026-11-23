import { getProfile, hasCurrentConsent } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { rememberInviteAndLogin } from "../actions";
import { AcceptForm } from "./accept-form";

export const metadata = { title: "Invito · NutriLife" };

export default async function InvitoPage({ params }: PageProps<"/invito/[token]">) {
  const { token } = await params;
  const profile = await getProfile();
  const ready = Boolean(profile && hasCurrentConsent(profile));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold">Sei stato invitato</h1>
        <p className="text-lg text-muted-foreground">
          Il tuo nutrizionista ti invita su NutriLife: preparerà i tuoi pasti tipo, tu sceglierai i
          giorni e la gastronomia ti preparerà il pasto già pesato.
        </p>
      </div>

      {ready ? (
        <AcceptForm token={token} />
      ) : (
        <form action={rememberInviteAndLogin} className="flex flex-col gap-3">
          <input type="hidden" name="token" value={token} />
          <Button type="submit" size="lg" className="h-12 rounded-full text-base">
            {profile ? "Continua" : "Accedi per accettare"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {profile
              ? "Prima completa il benvenuto, poi tornerai qui."
              : "Ti chiederemo solo la tua email: niente password."}
          </p>
        </form>
      )}
    </main>
  );
}
