import { ComingSoon, RoleArea } from "@/components/role-area";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "I tuoi pazienti · NutriLife" };

export default async function Page() {
  const profile = await requireProfile(["nutrizionista"]);

  return (
    <RoleArea profile={profile} title="I tuoi pazienti">
      <ComingSoon items={["Elenco dei pazienti", "Pasti tipo con basi e grammature", "Invito del paziente con un link"]} />
    </RoleArea>
  );
}
