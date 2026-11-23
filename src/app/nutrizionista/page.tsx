import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { RoleArea } from "@/components/role-area";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./invite-form";

export const metadata = { title: "I tuoi pazienti · NutriLife" };

type PatientRow = {
  patient_id: string;
  created_at: string;
  patient: { full_name: string | null; email: string | null } | null;
};

const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "Europe/Rome" });

export default async function NutrizionistaPage() {
  const profile = await requireProfile(["nutrizionista"]);
  const supabase = await createClient();

  const [{ data: links }, { data: templates }, { data: invites }] = await Promise.all([
    supabase
      .from("nutritionist_patients")
      .select("patient_id, created_at, patient:profiles!nutritionist_patients_patient_id_fkey(full_name, email)")
      .eq("nutritionist_id", profile.id),
    supabase
      .from("meal_templates")
      .select("patient_id")
      .eq("nutritionist_id", profile.id)
      .eq("active", true),
    supabase
      .from("invites")
      .select("id, label, expires_at, accepted_at")
      .eq("nutritionist_id", profile.id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const patients = ((links ?? []) as unknown as PatientRow[]).sort((a, b) =>
    (a.patient?.full_name ?? "").localeCompare(b.patient?.full_name ?? "", "it"),
  );
  const countByPatient = new Map<string, number>();
  for (const t of templates ?? []) {
    countByPatient.set(t.patient_id, (countByPatient.get(t.patient_id) ?? 0) + 1);
  }

  return (
    <RoleArea profile={profile} title="I tuoi pazienti">
      <section className="flex flex-col gap-3">
        {patients.length === 0 && (
          <p className="text-muted-foreground">
            Nessun paziente ancora. Crea un link d&apos;invito qui sotto e mandalo al paziente.
          </p>
        )}
        {patients.map((p) => {
          const count = countByPatient.get(p.patient_id) ?? 0;
          return (
            <Link
              key={p.patient_id}
              href={`/nutrizionista/pazienti/${p.patient_id}`}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{p.patient?.full_name || p.patient?.email}</span>
                <span className="text-sm text-muted-foreground">
                  {count === 0 ? "Nessun pasto tipo" : count === 1 ? "1 pasto tipo" : `${count} pasti tipo`}
                </span>
              </span>
              <ArrowRight aria-hidden className="size-5 shrink-0" />
            </Link>
          );
        })}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <h2 className="text-xl">Invita un paziente</h2>
        <InviteForm />
      </section>

      {(invites ?? []).length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm text-muted-foreground">Inviti in attesa</h2>
          {(invites ?? []).map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm">
              <span>{i.label}</span>
              <span className="text-muted-foreground">scade il {dateFmt.format(new Date(i.expires_at))}</span>
            </div>
          ))}
        </section>
      )}
    </RoleArea>
  );
}
