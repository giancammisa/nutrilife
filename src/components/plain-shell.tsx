import Link from "next/link";
import { Wordmark } from "@/components/brand";

// Cornice delle pagine fuori dalle aree riservate (accesso, benvenuto, invito…).
export function PlainShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-white/45 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-3">
          <Link href="/" aria-label="NutriLife, pagina iniziale" className="text-lg">
            <Wordmark />
          </Link>
          <span className="glass rounded-full px-3 py-1 text-xs font-medium">Cucina 3.0</span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pt-10 pb-16">{children}</main>
    </div>
  );
}
