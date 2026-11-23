import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { CheckboxField } from "@/components/checkbox-field";
import { Label } from "@/components/ui/label";
import { requireProfile, ROLE_LABEL, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateUser } from "../actions";

export const metadata = { title: "Utenti · NutriLife" };

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  active: boolean;
  privacy_consent_at: string | null;
  created_at: string;
};

export default async function UtentiPage() {
  const profile = await requireProfile(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, active, privacy_consent_at, created_at")
    .order("created_at", { ascending: false });
  const users = (data ?? []) as UserRow[];

  return (
    <RoleArea profile={profile} title="Utenti" back={{ href: "/admin", label: "Pannello admin" }}>
      <p className="text-muted-foreground">
        Tutti nascono <strong>clienti</strong>. Qui puoi farli diventare nutrizionisti, cucina o
        admin, e disattivarli.
      </p>

      {users.map((u) => (
        <section key={u.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <div className="flex flex-col">
            <span className="font-medium">{u.full_name || "Nome non ancora inserito"}</span>
            <span className="break-all text-sm text-muted-foreground">{u.email ?? "—"}</span>
            {!u.privacy_consent_at && (
              <span className="text-xs text-muted-foreground">Consenso privacy non ancora dato</span>
            )}
          </div>
          <ActionForm action={updateUser} submitLabel="Salva">
            <input type="hidden" name="id" value={u.id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor={`role-${u.id}`}>Ruolo</Label>
              <select
                id={`role-${u.id}`}
                name="role"
                defaultValue={u.role}
                className="h-11 rounded-lg border border-input bg-background px-3 text-base"
              >
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
            <CheckboxField
              id={`active-${u.id}`}
              name="active"
              label="Account attivo"
              defaultChecked={u.active}
            />
          </ActionForm>
        </section>
      ))}
    </RoleArea>
  );
}
