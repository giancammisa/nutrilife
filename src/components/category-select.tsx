import { Label } from "@/components/ui/label";
import { BASE_CATEGORIES } from "@/lib/allergens";

export function CategorySelect({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="category">Categoria</Label>
      <select
        id="category"
        name="category"
        required
        defaultValue={defaultValue}
        className="h-11 rounded-lg border border-input bg-background px-3 text-base"
      >
        <option value="" disabled>
          Scegli…
        </option>
        {BASE_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
