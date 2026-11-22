import { ComingSoon, RoleArea } from "@/components/role-area";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "La mia settimana · NutriLife" };

export default async function Page() {
  const profile = await requireProfile(["cliente"]);

  return (
    <RoleArea profile={profile} title="La mia settimana">
      <ComingSoon items={["Calendario con i tuoi pasti tipo", "Ordina entro le 18:00 del giorno prima", "Il tuo pacchetto e i pasti rimasti"]} />
    </RoleArea>
  );
}
