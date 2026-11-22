import { ComingSoon, RoleArea } from "@/components/role-area";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "Ordini di domani · NutriLife" };

export default async function Page() {
  const profile = await requireProfile(["cucina"]);

  return (
    <RoleArea profile={profile} title="Ordini di domani">
      <ComingSoon items={["Lista degli ordini con le grammature", "Riepilogo di produzione", "Etichette da stampare"]} />
    </RoleArea>
  );
}
