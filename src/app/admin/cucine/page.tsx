import Link from "next/link";
import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createKitchen } from "../actions";

export const metadata = { title: "Gastronomie · NutriLife" };

export default async function CucinePage() {
  const profile = await requireProfile(["admin"]);
  const supabase = await createClient();
  const { data: kitchens } = await supabase
    .from("kitchens")
    .select("id, name, address, active, kitchen_bases(count)")
    .order("name");

  return (
    <RoleArea profile={profile} title="Gastronomie" back={{ href: "/admin", label: "Pannello admin" }}>
      <section className="flex flex-col gap-3">
        {(kitchens ?? []).length === 0 && (
          <p className="text-muted-foreground">Nessuna gastronomia. Aggiungi la prima qui sotto.</p>
        )}
        {(kitchens ?? []).map((k) => {
          const basesCount = (k.kitchen_bases as unknown as { count: number }[])[0]?.count ?? 0;
          return (
            <Link
              key={k.id}
              href={`/admin/cucine/${k.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{k.name}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {k.address || "Indirizzo non indicato"} · {basesCount} basi
                </span>
              </span>
              {!k.active && (
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs">Disattivata</span>
              )}
            </Link>
          );
        })}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <h2 className="section-title">Nuova gastronomia</h2>
        <ActionForm action={createKitchen} submitLabel="Aggiungi gastronomia" resetOnSuccess>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required maxLength={120} placeholder="Gastronomia Rossi" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Indirizzo</Label>
            <Input id="address" name="address" maxLength={200} placeholder="Via Roma 1, Città" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" name="phone" type="tel" maxLength={30} placeholder="080 …" />
          </div>
        </ActionForm>
      </section>
    </RoleArea>
  );
}
