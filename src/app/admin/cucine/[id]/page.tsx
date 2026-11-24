import Link from "next/link";
import { notFound } from "next/navigation";
import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { BasePicker } from "@/components/base-picker";
import { AllergenBadges } from "@/components/allergen-badges";
import { CheckboxField } from "@/components/checkbox-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth";
import { categoryLabel } from "@/lib/allergens";
import { formatEuro } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { addBaseToKitchen, addKitchenMember, removeKitchenMember, updateKitchen } from "../../actions";

type KitchenBaseRow = {
  id: string;
  allergens: string[];
  allergens_declared: boolean;
  available: boolean;
  price_per_kg_cents: number | null;
  bases: { id: string; name: string; category: string } | null;
};

export default async function CucinaPage({ params }: PageProps<"/admin/cucine/[id]">) {
  const profile = await requireProfile(["admin"]);
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: kitchen }, { data: kitchenBases }, { data: catalog }, { data: members }, { data: kitchenUsers }] =
    await Promise.all([
      supabase.from("kitchens").select("id, name, address, phone, active, fixed_fee_cents").eq("id", id).maybeSingle(),
      supabase
        .from("kitchen_bases")
        .select("id, allergens, allergens_declared, available, price_per_kg_cents, bases(id, name, category)")
        .eq("kitchen_id", id),
      supabase.from("bases").select("id, name, category").eq("active", true).order("name"),
      supabase.from("kitchen_members").select("profile_id, profiles(full_name, email)").eq("kitchen_id", id),
      supabase.from("profiles").select("id, full_name, email").or("role.eq.cucina,allowed_roles.cs.{cucina}").order("full_name"),
    ]);

  const memberRows = (members ?? []) as unknown as {
    profile_id: string;
    profiles: { full_name: string | null; email: string | null } | null;
  }[];
  const memberIds = new Set(memberRows.map((m) => m.profile_id));
  const linkable = (kitchenUsers ?? []).filter((u) => !memberIds.has(u.id));

  if (!kitchen) notFound();

  const rows = ((kitchenBases ?? []) as unknown as KitchenBaseRow[]).sort((a, b) =>
    (a.bases?.name ?? "").localeCompare(b.bases?.name ?? "", "it"),
  );
  const usedBaseIds = new Set(rows.map((r) => r.bases?.id));
  const addable = (catalog ?? []).filter((b) => !usedBaseIds.has(b.id));
  const unverified = rows.filter((r) => !r.allergens_declared).length;
  const unpriced = rows.filter((r) => !r.price_per_kg_cents).length;

  return (
    <RoleArea profile={profile} title={kitchen.name} back={{ href: "/admin/cucine", label: "Gastronomie" }}>
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="section-title">Basi della gastronomia</h2>
          <span className="text-sm text-muted-foreground">{rows.length}</span>
        </div>
        {unverified > 0 && (
          <p className="rounded-lg bg-warning/15 p-3 text-sm">
            {unverified === 1 ? "1 base ha" : `${unverified} basi hanno`} gli allergeni ancora da
            verificare con la cucina.
          </p>
        )}
        {unpriced > 0 && (
          <p className="rounded-lg bg-warning/15 p-3 text-sm">
            {unpriced === 1 ? "1 base non ha" : `${unpriced} basi non hanno`} ancora il prezzo: i
            pasti che la usano non si potranno ordinare qui.
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
                {r.price_per_kg_cents ? `${formatEuro(r.price_per_kg_cents)}/kg` : "senza prezzo"} ·{" "}
                {categoryLabel(r.bases?.category ?? "")}
                {!r.available && " · non disponibile"}
              </span>
            </span>
            <AllergenBadges declared={r.allergens_declared} allergens={r.allergens} />
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <h2 className="section-title">Aggiungi una base</h2>
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
            <BasePicker bases={addable} label="Base dal catalogo" />
          </ActionForm>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-1">
          <h2 className="section-title">Chi lavora qui</h2>
          <p className="text-xs text-muted-foreground">
            Vedono gli ordini di questa gastronomia e stampano le etichette. Prima dai loro il ruolo
            “Cucina” nella pagina Utenti.
          </p>
        </div>
        {memberRows.length === 0 && <p className="text-sm text-muted-foreground">Nessuno collegato.</p>}
        {memberRows.map((m) => (
          <div key={m.profile_id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{m.profiles?.full_name || "Nome non inserito"}</span>
              <span className="truncate text-muted-foreground">{m.profiles?.email}</span>
            </span>
            <form action={removeKitchenMember}>
              <input type="hidden" name="kitchen_id" value={kitchen.id} />
              <input type="hidden" name="profile_id" value={m.profile_id} />
              <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                Scollega
              </Button>
            </form>
          </div>
        ))}
        <Link href={`/cucina?cucina=${kitchen.id}`} className="w-fit text-sm text-primary underline">
          Apri la vista della cucina
        </Link>
        {linkable.length > 0 ? (
          <ActionForm action={addKitchenMember} submitLabel="Collega" resetOnSuccess>
            <input type="hidden" name="kitchen_id" value={kitchen.id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile_id">Utente con ruolo Cucina</Label>
              <select
                id="profile_id"
                name="profile_id"
                required
                defaultValue=""
                className="h-11 rounded-lg border border-input bg-background px-3 text-base"
              >
                <option value="" disabled>
                  Scegli…
                </option>
                {linkable.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
            </div>
          </ActionForm>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nessun altro utente con ruolo Cucina da collegare.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <h2 className="section-title">Dati della gastronomia</h2>
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="fixed_fee">Costo fisso per pasto (€)</Label>
            <Input
              id="fixed_fee"
              name="fixed_fee"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={(kitchen.fixed_fee_cents / 100).toFixed(2).replace(".", ",")}
            />
            <p className="text-xs text-muted-foreground">
              Preparazione, contenitore, etichetta: si aggiunge al prezzo di ogni pasto.
            </p>
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
