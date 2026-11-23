import Link from "next/link";
import { signOut } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, type Profile } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// Cornice comune delle aree riservate: intestazione con nome, ruolo e "Esci".
export async function RoleArea({
  profile,
  title,
  back,
  children,
}: {
  profile: Profile;
  title: string;
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const firstName = profile.full_name?.split(" ")[0] ?? "";
  const { betaMode } = await getSettings();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6">
      {betaMode && (
        <p className="-mx-6 bg-accent/40 px-6 py-1.5 text-center text-xs font-medium">
          Versione di prova · segnalaci qualunque problema
        </p>
      )}
      <header className="flex items-center justify-between gap-4 border-b py-4">
        <span className="font-heading text-lg font-extrabold">NutriLife</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{ROLE_LABEL[profile.role]}</Badge>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Esci
            </Button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6 py-8">
        <div className="flex flex-col gap-1">
          {back ? (
            <Link href={back.href} className="w-fit text-sm text-primary underline-offset-4 hover:underline">
              ← {back.label}
            </Link>
          ) : (
            <p className="text-muted-foreground">Ciao {firstName}</p>
          )}
          <h1 className="text-3xl font-extrabold">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}

export function ComingSoon({ items }: { items: string[] }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">In arrivo</p>
      <ul className="mt-3 flex flex-col gap-2 text-card-foreground">
        {items.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}
