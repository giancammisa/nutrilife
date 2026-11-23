import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { CheckboxField } from "@/components/checkbox-field";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { updateSettings } from "../actions";

export const metadata = { title: "Impostazioni · NutriLife" };

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // dalle 6 alle 23

export default async function ImpostazioniPage() {
  const profile = await requireProfile(["admin"]);
  const settings = await getSettings();

  return (
    <RoleArea profile={profile} title="Impostazioni" back={{ href: "/admin", label: "Pannello admin" }}>
      <ActionForm action={updateSettings} submitLabel="Salva impostazioni">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cutoff_hour">Orario limite per ordinare (il giorno prima)</Label>
          <select
            id="cutoff_hour"
            name="cutoff_hour"
            defaultValue={settings.cutoffHour}
            className="h-11 rounded-lg border border-input bg-background px-3 text-base"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Ora italiana. Vale subito per tutti gli ordini ancora da fare; gli ordini già fatti non
            cambiano.
          </p>
        </div>

        <CheckboxField
          id="beta_mode"
          name="beta_mode"
          label="Modalità prova (BETA)"
          hint="Mostra a tutti la fascia “Versione di prova”. Toglila quando NutriLife è pronta per il pubblico."
          defaultChecked={settings.betaMode}
        />
      </ActionForm>
    </RoleArea>
  );
}
