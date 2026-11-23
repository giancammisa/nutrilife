import Link from "next/link";
import { ComingSoon, RoleArea } from "@/components/role-area";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pannello admin · NutriLife" };

export default async function AdminPage() {
  const profile = await requireProfile(["admin"]);
  const supabase = await createClient();

  const [{ count: kitchens }, { count: bases }, { count: users }] = await Promise.all([
    supabase.from("kitchens").select("id", { count: "exact", head: true }),
    supabase.from("bases").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const sections = [
    { href: "/admin/cucine", title: "Gastronomie", detail: `${kitchens ?? 0} in elenco` },
    { href: "/admin/basi", title: "Catalogo basi", detail: `${bases ?? 0} basi` },
    { href: "/admin/utenti", title: "Utenti", detail: `${users ?? 0} registrati` },
  ];

  return (
    <RoleArea profile={profile} title="Pannello admin">
      <nav className="flex flex-col gap-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center justify-between rounded-lg border bg-card p-5 transition-colors hover:border-primary"
          >
            <span className="flex flex-col">
              <span className="font-heading text-lg font-extrabold">{s.title}</span>
              <span className="text-sm text-muted-foreground">{s.detail}</span>
            </span>
            <span aria-hidden className="text-primary">→</span>
          </Link>
        ))}
      </nav>
      <ComingSoon items={["Pacchetti prepagati"]} />
    </RoleArea>
  );
}
