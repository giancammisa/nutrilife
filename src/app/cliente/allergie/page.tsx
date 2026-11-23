import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { CheckboxField } from "@/components/checkbox-field";
import { requireProfile } from "@/lib/auth";
import { ALLERGENS } from "@/lib/allergens";
import { createClient } from "@/lib/supabase/server";
import { saveAllergies } from "../actions";

export const metadata = { title: "Le mie allergie · NutriLife" };

export default async function AllergiePage() {
  const profile = await requireProfile(["cliente"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("allergies, intolerances, health_consent_at")
    .eq("id", profile.id)
    .single();

  const allergies: string[] = data?.allergies ?? [];
  const intolerances: string[] = data?.intolerances ?? [];

  return (
    <RoleArea profile={profile} title="Le mie allergie" back={{ href: "/cliente", label: "La mia settimana" }}>
      <p className="text-muted-foreground">
        Se un pasto contiene un tuo <strong>allergene</strong>, l&apos;ordine viene bloccato. Per le{" "}
        <strong>intolleranze</strong> ti mostriamo solo un avviso.
      </p>

      <ActionForm action={saveAllergies} submitLabel="Salva">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-lg font-extrabold">Allergie</legend>
          {ALLERGENS.map((a) => (
            <CheckboxField
              key={a.code}
              id={`allergy-${a.code}`}
              name="allergies"
              value={a.code}
              label={a.name}
              defaultChecked={allergies.includes(a.code)}
            />
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-lg font-extrabold">Intolleranze</legend>
          {ALLERGENS.map((a) => (
            <CheckboxField
              key={a.code}
              id={`intolerance-${a.code}`}
              name="intolerances"
              value={a.code}
              label={a.name}
              defaultChecked={intolerances.includes(a.code)}
            />
          ))}
        </fieldset>

        <div className="rounded-lg border border-primary/40 bg-primary/5 p-1">
          <CheckboxField
            id="consent"
            name="consent"
            label="Acconsento al trattamento di questi dati sulla salute per evitare pasti pericolosi"
            hint="Li usiamo solo per controllare gli ordini. Puoi toglierli quando vuoi lasciando tutto vuoto."
            defaultChecked={Boolean(data?.health_consent_at)}
          />
        </div>
      </ActionForm>
    </RoleArea>
  );
}
