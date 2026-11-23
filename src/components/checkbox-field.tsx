import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Casella con etichetta cliccabile, pensata per il dito sul telefono.
export function CheckboxField({
  id,
  name,
  value,
  label,
  hint,
  defaultChecked,
}: {
  id: string;
  name: string;
  value?: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
      <Checkbox id={id} name={name} value={value} defaultChecked={defaultChecked} className="mt-0.5" />
      <Label htmlFor={id} className="flex flex-col items-start gap-0.5 font-normal">
        <span>{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </Label>
    </div>
  );
}
