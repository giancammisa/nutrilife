import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { Wordmark } from "@/components/brand";
import { ROLE_LABEL, type Profile } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// Cornice comune delle aree riservate: banda gialla con il marchio, ruolo e "Esci",
// poi il titolo della pagina in voce espansa.
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
    <div className="flex flex-1 flex-col">
      {betaMode && (
        <p className="bg-ink px-6 py-1.5 text-center text-xs font-medium text-lemon">
          Versione di prova · segnalaci qualunque problema
        </p>
      )}
      <header className="bg-lemon text-ink">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-6 py-4">
          <Link href="/home" aria-label="NutriLife, vai alla tua area" className="text-xl">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-lemon">
              {ROLE_LABEL[profile.role]}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-ink"
                aria-label={`Esci${firstName ? `, ${firstName}` : ""}`}
                title="Esci"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pt-7 pb-12">
        <div className="flex flex-col gap-3">
          {back && (
            <Link
              href={back.href}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {back.label}
            </Link>
          )}
          <h1 className="text-[1.85rem] sm:text-4xl">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}

export function ComingSoon({ items }: { items: string[] }) {
  return (
    <div className="rounded-[14px] border border-dashed border-ink/25 p-5">
      <h2 className="text-sm">In arrivo</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
