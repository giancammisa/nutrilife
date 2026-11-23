import Link from "next/link";
import { Wordmark } from "@/components/brand";

// Cornice delle pagine fuori dalle aree riservate (accesso, benvenuto, invito…):
// banda gialla con il marchio, poi il contenuto su carta.
export function PlainShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-lemon text-ink">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-4">
          <Link href="/" aria-label="NutriLife, pagina iniziale" className="text-xl">
            <Wordmark />
          </Link>
          <span className="display text-xs">Cucina 3.0</span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 pt-10 pb-16">
        {children}
      </main>
    </div>
  );
}
