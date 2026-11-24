import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { AllergenBadges } from "@/components/allergen-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BASE_CATEGORIES, categoryLabel } from "@/lib/allergens";
import { getKitchenContext } from "@/lib/kitchen";
import { formatEuro } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { addBase, setFee } from "./actions";

export const metadata = { title: "Listino · NutriLife" };

type Row = {
  id: string;
  allergens: string[];
  allergens_declared: boolean;
  available: boolean;
  price_per_kg_cents: number | null;
  bases: { id: string; name: string; category: string } | null;
};

// Listino della gastronomia: basi, prezzi al kg, allergeni, costo fisso per pasto.
export default async function ListinoPage({ searchParams }: PageProps<"/cucina/listino">) {
  const ctx = await getKitchenContext(await searchParams);
  if (!ctx.kitchen) {
    return (
      <RoleArea profile={ctx.profile} title="Listino" back={{ href: "/cucina", label: "Ordini" }}>
        <p className="rounded-lg bg-muted p-4 text-sm">Non sei collegato a nessuna gastronomia. Chiedi all&apos;admin.</p>
      </RoleArea>
    );
  }
  const { profile, kitchen, kitchens } = ctx;
  const supabase = await createClient();

  const [{ data: kb }, { data: catalog }, { data: k }] = await Promise.all([
    supabase
      .from("kitchen_bases")
      .select("id, allergens, allergens_declared, available, price_per_kg_cents, bases(id, name, category)")
      .eq("kitchen_id", kitchen.id),
    supabase.from("bases").select("id, name, category").eq("active", true).order("name"),
    supabase.from("kitchens").select("fixed_fee_cents").eq("id", kitchen.id).maybeSingle(),
  ]);

  const catOrder = (c: string) => BASE_CATEGORIES.findIndex((x) => x.value === c);
  const rows = ((kb ?? []) as unknown as Row[]).sort(
    (a, b) =>
      catOrder(a.bases?.category ?? "") - catOrder(b.bases?.category ?? "") ||
      (a.bases?.name ?? "").localeCompare(b.bases?.name ?? "", "it"),
  );
  const used = new Set(rows.map((r) => r.bases?.id));
  const addable = (catalog ?? []).filter((b) => !used.has(b.id));
  const unpriced = rows.filter((r) => !r.price_per_kg_cents).length;
  const unverified = rows.filter((r) => !r.allergens_declared).length;
  const q = `?cucina=${kitchen.id}`;

  return (
    <RoleArea profile={profile} title="Listino" back={{ href: `/cucina${q}`, label: "Ordini" }}>
      <div className="flex flex-col gap-3">
        {kitchens.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {kitchens.map((x) => (
              <Button key={x.id} asChild size="sm" variant={x.id === kitchen.id ? "default" : "outline"} className="rounded-full">
                <Link href={`/cucina/listino?cucina=${x.id}`}>{x.name}</Link>
              </Button>
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {kitchen.name} · prezzi al kg delle basi cotte. Il cliente vede solo il prezzo del pasto.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="section-title">Le tue basi</h2>
          <span className="text-sm text-muted-foreground">{rows.length}</span>
        </div>
        {unpriced > 0 && (
          <p className="rounded-[20px] bg-warning/10 p-3 text-sm">
            {unpriced === 1 ? "1 base è" : `${unpriced} basi sono`} senza prezzo: i pasti che la usano non si possono
            ordinare da te.
          </p>
        )}
        {unverified > 0 && (
          <p className="rounded-[20px] bg-warning/10 p-3 text-sm">
            {unverified === 1 ? "1 base ha" : `${unverified} basi hanno`} gli allergeni da verificare.
          </p>
        )}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Nessuna base. Aggiungine una qui sotto.</p>}
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/cucina/listino/${r.id}${q}`}
            className="flex flex-col gap-2 rounded-[24px] border bg-card p-4 transition-colors hover:border-ink/25"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="flex flex-col">
                <span className="card-title">{r.bases?.name}</span>
                <span className="text-xs text-muted-foreground">
                  {categoryLabel(r.bases?.category ?? "")}
                  {!r.available && " · non disponibile"}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className={r.price_per_kg_cents ? "num text-base" : "text-sm text-warning"}>
                  {r.price_per_kg_cents ? `${formatEuro(r.price_per_kg_cents)}/kg` : "senza prezzo"}
                </span>
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </span>
            <AllergenBadges declared={r.allergens_declared} allergens={r.allergens} />
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-[28px] border bg-card p-5">
        <h2 className="section-title">Aggiungi una base</h2>
        {addable.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Hai già tutte le basi del catalogo. Per una base nuova chiedi all&apos;admin di aggiungerla al catalogo.
          </p>
        ) : (
          <ActionForm action={addBase} submitLabel="Aggiungi al listino" resetOnSuccess>
            <input type="hidden" name="kitchen_id" value={kitchen.id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="base_id">Base dal catalogo</Label>
              <select
                id="base_id"
                name="base_id"
                required
                defaultValue=""
                className="h-12 rounded-lg border border-input bg-white/70 px-3 text-base"
              >
                <option value="" disabled>
                  Scegli…
                </option>
                {addable.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({categoryLabel(b.category)})
                  </option>
                ))}
              </select>
            </div>
          </ActionForm>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-[28px] border bg-card p-5">
        <div className="flex flex-col gap-1">
          <h2 className="section-title">Costo fisso per pasto</h2>
          <p className="text-sm text-muted-foreground">Si aggiunge a ogni pasto (confezione, preparazione).</p>
        </div>
        <ActionForm action={setFee} submitLabel="Salva costo fisso">
          <input type="hidden" name="kitchen_id" value={kitchen.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="fixed_fee">Euro a pasto</Label>
            <Input
              id="fixed_fee"
              name="fixed_fee"
              inputMode="decimal"
              defaultValue={((k?.fixed_fee_cents ?? 0) / 100).toFixed(2).replace(".", ",")}
              className="h-12 text-base"
            />
          </div>
        </ActionForm>
      </section>
    </RoleArea>
  );
}
