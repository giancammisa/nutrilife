import Link from "next/link";
import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth";
import { BASE_CATEGORIES } from "@/lib/allergens";
import { CategorySelect } from "@/components/category-select";
import { createClient } from "@/lib/supabase/server";
import { createBase } from "../actions";

export const metadata = { title: "Catalogo basi · NutriLife" };

export default async function BasiPage() {
  const profile = await requireProfile(["admin"]);
  const supabase = await createClient();
  const { data: bases } = await supabase
    .from("bases")
    .select("id, name, category, active")
    .order("name");

  return (
    <RoleArea profile={profile} title="Catalogo basi" back={{ href: "/admin", label: "Pannello admin" }}>
      <p className="text-muted-foreground">
        L&apos;elenco unico che userà il nutrizionista. Gli allergeni si indicano poi per ogni
        gastronomia, perché ogni cucina ha la sua ricetta.
      </p>

      {(bases ?? []).length === 0 && (
        <p className="text-muted-foreground">Il catalogo è vuoto. Aggiungi la prima base qui sotto.</p>
      )}

      {BASE_CATEGORIES.map((cat) => {
        const items = (bases ?? []).filter((b) => b.category === cat.value);
        if (items.length === 0) return null;
        return (
          <section key={cat.value} className="flex flex-col gap-2">
            <h2 className="section-title">{cat.label}</h2>
            {items.map((b) => (
              <Link
                key={b.id}
                href={`/admin/basi/${b.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary"
              >
                <span className="font-medium">{b.name}</span>
                {!b.active && (
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs">Disattivata</span>
                )}
              </Link>
            ))}
          </section>
        );
      })}

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <h2 className="section-title">Nuova base</h2>
        <ActionForm action={createBase} submitLabel="Aggiungi al catalogo" resetOnSuccess>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required maxLength={120} placeholder="Petto di pollo alla piastra" />
          </div>
          <CategorySelect />
        </ActionForm>
      </section>
    </RoleArea>
  );
}
