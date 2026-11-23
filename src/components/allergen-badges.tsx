import { allergenName, allergenState } from "@/lib/allergens";
import { cn } from "@/lib/utils";

// Mostra gli allergeni di una base nei tre stati: non verificato, nessuno, contiene.
export function AllergenBadges({
  declared,
  allergens,
  className,
}: {
  declared: boolean;
  allergens: string[];
  className?: string;
}) {
  const state = allergenState(declared, allergens);

  if (state === "non_verificato") {
    return (
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-full border border-warning/60 bg-warning/12 px-2.5 py-0.5 text-xs font-semibold text-foreground",
          className,
        )}
      >
        Allergeni non verificati
      </span>
    );
  }

  if (state === "nessuno") {
    return (
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-full bg-sage/12 px-2.5 py-0.5 text-xs font-semibold text-sage",
          className,
        )}
      >
        Nessun allergene
      </span>
    );
  }

  return (
    <span className={cn("flex flex-wrap gap-1.5", className)}>
      {allergens.map((code) => (
        <span
          key={code}
          className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive"
        >
          {allergenName(code)}
        </span>
      ))}
    </span>
  );
}
