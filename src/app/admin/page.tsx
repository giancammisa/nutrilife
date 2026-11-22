import { ComingSoon, RoleArea } from "@/components/role-area";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "Pannello admin · NutriLife" };

export default async function Page() {
  const profile = await requireProfile(["admin"]);

  return (
    <RoleArea profile={profile} title="Pannello admin">
      <ComingSoon items={["Cucine e basi con allergeni", "Pacchetti prepagati", "Ruoli e attivazione degli utenti"]} />
    </RoleArea>
  );
}
