import Link from "next/link";
import { ArrowLeft, ChevronDown, LogOut } from "lucide-react";
import { signOut, switchRole } from "@/app/actions";
import { Wordmark } from "@/components/brand";
import { ROLE_LABEL, type Profile } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// Cornice comune delle aree riservate: intestazione in vetro che resta in alto
// (marchio, ruolo, esci), poi il titolo grande e sottile.
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
      <header className="sticky top-0 z-50 border-b border-ink/5 bg-white/45 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-3">
          <Link href="/home" aria-label="NutriLife, vai alla tua area" className="text-lg">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2">
            {betaMode && (
              <span className="rounded-full bg-lemon px-2.5 py-1 text-[11px] font-semibold text-ink" title="Versione di prova: segnalaci qualunque problema">
                Prova
              </span>
            )}
            {profile.allowed_roles.length > 1 ? (
              // Cambia vista: menu semplice, funziona anche senza JavaScript
              <details className="group relative">
                <summary className="glass inline-flex h-9 cursor-pointer list-none items-center gap-1 rounded-full px-3 text-xs font-medium [&::-webkit-details-marker]:hidden">
                  {ROLE_LABEL[profile.role]}
                  <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
                  <span className="sr-only">: cambia vista</span>
                </summary>
                <div className="absolute right-0 z-40 mt-2 flex w-48 flex-col gap-1 rounded-[20px] border bg-popover p-1.5 text-popover-foreground">
                  <span className="px-3 pt-1.5 pb-1 text-xs text-muted-foreground">Vedi l&apos;app come</span>
                  {profile.allowed_roles.map((r) => (
                    <form key={r} action={switchRole} suppressHydrationWarning>
                      <input type="hidden" name="role" value={r} />
                      <button
                        type="submit"
                        aria-current={r === profile.role ? "true" : undefined}
                        className="flex h-11 w-full items-center justify-between rounded-[14px] px-3 text-left text-sm font-semibold hover:bg-muted aria-[current=true]:bg-ink aria-[current=true]:text-paper"
                      >
                        {ROLE_LABEL[r]}
                      </button>
                    </form>
                  ))}
                </div>
              </details>
            ) : (
              <span className="glass rounded-full px-3 py-1 text-xs font-medium">{ROLE_LABEL[profile.role]}</span>
            )}
            {/* Chrome su iPhone aggiunge un suo attributo ai moduli: non è un errore dell'app */}
            <form action={signOut} suppressHydrationWarning>
              <button
                type="submit"
                className="inline-flex size-9 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                aria-label={`Esci${firstName ? `, ${firstName}` : ""}`}
                title="Esci"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-7 pb-14">
        <div className="flex flex-col gap-4">
          {back && (
            <Link
              href={back.href}
              className="glass inline-flex w-fit items-center gap-2 rounded-full py-1.5 pr-4 pl-2 text-sm transition-colors hover:bg-white/90"
            >
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-ink text-paper">
                <ArrowLeft className="size-3.5" aria-hidden />
              </span>
              {back.label}
            </Link>
          )}
          <h1 className="text-[2.5rem] sm:text-5xl">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}

export function ComingSoon({ items }: { items: string[] }) {
  return (
    <div className="rounded-[28px] border border-dashed border-ink/20 p-5">
      <h2 className="section-title">In arrivo</h2>
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
