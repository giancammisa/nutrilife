import Link from "next/link";
import { notFound } from "next/navigation";
import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { AllergenBadges } from "@/components/allergen-badges";
import { CheckboxField } from "@/components/checkbox-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth";
import { categoryLabel } from "@/lib/allergens";
import { createClient } from "@/lib/supabase/server";
import { addBaseToKitchen, updateKitchen } from "../../actions";

type KitchenBaseRow = {
  id: string;
  allergens: string[];
  allergens_declared: boolean;
  available: boolean;
  bases: { id: string; name: string; category: string } | null;
};

export default async function CucinaPage({ params }: PageProps<"/admin/cucine/[id]">) {
  const profile = await requireProfile(["admin"]);
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: kitchen }, { data: kitchenBases }, { data: catalog }] = await Promise.all([
    supabase.from("kitchens").select("id, name, address, phone, active").eq("id", id).maybeSingle(),
    supabase
      .from("kitchen_bases")
      .select("id, allergens, allergens_declared, available, bases(id, name, category)")
      .eq("kitchen_id", id),
    supabase.from("bases").select("id, name, category").eq("active", true).order("name"),
  ]);

  if (!kitchen) notFound();

  const rows = ((kitchenBases ?? []) as unknown as KitchenBaseRow[]).sort((a, b) =>
    (a.bases?.name ?? "").localeCompare(b.bases?.name ?? "", "it"),
  );
  const usedBaseIds = new Set(rows.map((r) => r.bases?.id));
  const addable = (catalog ?? []).filter((b) => !usedBaseIds.has(b.id));
  const unverified = rows.filter((r) => !r.allergens_declared).length;

  return (
    <RoleArea profile={profile} title={kitchen.name} back={{ href: "/admin/cucine", label: "Gastronomie" }}>
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-extrabold">Basi della gastronomia</h2>
          <span className="text-sm text-muted-foreground">{rows.length}</span>
        </div>
        {unverified > 0 && (
          <p className="rounded-lg bg-warning/15 p-3 text-sm">
            {unverified === 1 ? "1 base ha" : `${unverified} basi hanno`} gli allergeni ancora da
            verificare con la cucina.
          </p>
        )}
        {rows.length === 0 && (
          <p className="text-muted-foreground">Nessuna base. Aggiungine una dal catalogo qui sotto.</p>
        )}
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/admin/cucine/${kitchen.id}/basi/${r.id}`}
            className="flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-medium">{r.bases?.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {categoryLabel(r.bases?.category ?? "")}
                {!r.available && " · non disponibile"}
              </span>
            </span>
            <AllergenBadges declared={r.allergens_declared} allergens={r.allergens} />
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <h2 className="text-xl font-extrabold">Aggiungi una base</h2>
        {addable.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tutte le basi del catalogo sono già qui.{" "}
            <Link href="/admin/basi" className="text-primary underline">
              Aggiungi basi al catalogo
            </Link>
          </p>
        ) : (
          <ActionForm action={addBaseToKitchen} submitLabel="Aggiungi alla gastronomia" resetOnSuccess>
            <input type="hidden" name="kitchen_id" value={kitchen.id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="base_id">Base dal catalogo</Label>
              <select
                id="base_id"
                name="base_id"
                required
                defaultValue=""
                className="h-11 rounded-lg border border-input bg-background px-3 text-base"
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

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <h2 className="text-xl font-extrabold">Dati della gastronomia</h2>
        <ActionForm action={updateKitchen} submitLabel="Salva">
          <input type="hidden" name="id" value={kitchen.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required maxLength={120} defaultValue={kitchen.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Indirizzo</Label>
            <Input id="address" name="address" maxLength={200} defaultValue={kitchen.address ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" name="phone" type="tel" maxLength={30} defaultValue={kitchen.phone ?? ""} />
          </div>
          <CheckboxField
            id="active"
            name="active"
            label="Gastronomia attiva"
            hint="Se la togli, i clienti non la vedono più. Lo storico resta."
            defaultChecked={kitchen.active}
          />
        </ActionForm>
      </section>
    </RoleArea>
  );
}
