import { notFound } from "next/navigation";
import { RoleArea } from "@/components/role-area";
import { ActionForm } from "@/components/action-form";
import { CheckboxField } from "@/components/checkbox-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateBase } from "../../actions";
import { CategorySelect } from "@/components/category-select";

export default async function BasePage({ params }: PageProps<"/admin/basi/[id]">) {
  const profile = await requireProfile(["admin"]);
  const { id } = await params;
  const supabase = await createClient();
  const { data: base } = await supabase
    .from("bases")
    .select("id, name, category, active")
    .eq("id", id)
    .maybeSingle();

  if (!base) notFound();

  return (
    <RoleArea profile={profile} title={base.name} back={{ href: "/admin/basi", label: "Catalogo basi" }}>
      <ActionForm action={updateBase} submitLabel="Salva">
        <input type="hidden" name="id" value={base.id} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required maxLength={120} defaultValue={base.name} />
        </div>
        <CategorySelect defaultValue={base.category} />
        <CheckboxField
          id="active"
          name="active"
          label="Base attiva"
          hint="Se la togli, il nutrizionista non può più sceglierla per nuovi pasti tipo."
          defaultChecked={base.active}
        />
      </ActionForm>
    </RoleArea>
  );
}
