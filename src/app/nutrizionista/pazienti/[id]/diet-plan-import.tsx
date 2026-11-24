"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Plus, Trash2 } from "lucide-react";
import { createTemplatesFromPlan, readDietPlan, type ReviewedMeal } from "../../actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BASE_CATEGORIES } from "@/lib/allergens";

type Base = { id: string; name: string; category: string };
type DraftItem = { key: string; base_id: string; food: string; grams: number; choice_group: number | null };
type DraftMeal = { key: string; name: string; slot: "pranzo" | "cena"; items: DraftItem[] };

const MAX_BYTES = 4 * 1024 * 1024;
let seq = 0;
const k = () => `k${++seq}`;

// Le foto grandi del telefono si rimpiccioliscono qui (max 2000 px, JPG) prima dell'invio.
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= 1.5 * 1024 * 1024 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  return blob ? new File([blob], "piano.jpg", { type: "image/jpeg" }) : file;
}

export function DietPlanImport({ patientId, bases }: { patientId: string; bases: Base[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [meals, setMeals] = useState<DraftMeal[] | null>(null);

  const byCategory = BASE_CATEGORIES.map((c) => ({ ...c, bases: bases.filter((b) => b.category === c.value) })).filter(
    (c) => c.bases.length > 0,
  );

  function read() {
    setError(null);
    setOk(null);
    start(async () => {
      if (!file) return setError("Scegli un PDF o una foto del piano.");
      const small = await shrinkImage(file);
      if (small.size > MAX_BYTES) return setError("Il file è troppo grande (massimo 4 MB).");
      const fd = new FormData();
      fd.set("file", small);
      if (privacy) fd.set("privacy", "on");
      const res = await readDietPlan(fd);
      if (!res.ok) return setError(res.error);
      setWarnings(res.plan.warnings);
      setMeals(
        res.plan.meals.map((m) => ({
          key: k(),
          name: m.name,
          slot: m.slot,
          items: m.items.map((i) => ({ key: k(), base_id: i.base_id ?? "", food: i.food, grams: i.grams, choice_group: i.choice_group })),
        })),
      );
      if (res.plan.meals.length === 0) setError("Non ho trovato pranzi o cene in questo piano.");
    });
  }

  function save() {
    if (!meals) return;
    setError(null);
    const missing = meals.flatMap((m) => m.items.filter((i) => !i.base_id).map((i) => `${m.name}: ${i.food}`));
    if (missing.length) return setError(`Scegli la base per: ${missing.join(", ")} (oppure togli la riga).`);
    const payload: ReviewedMeal[] = meals.map((m) => ({
      name: m.name,
      slot: m.slot,
      items: m.items.map((i) => ({ base_id: i.base_id, grams: i.grams, choice_group: i.choice_group })),
    }));
    start(async () => {
      const res = await createTemplatesFromPlan(patientId, payload);
      if (res.error) return setError(res.error);
      setOk(res.ok);
      setMeals(null);
      setFile(null);
      setWarnings([]);
      router.refresh();
    });
  }

  const patchMeal = (mk: string, patch: Partial<DraftMeal>) =>
    setMeals((ms) => ms!.map((m) => (m.key === mk ? { ...m, ...patch } : m)));
  const patchItem = (mk: string, ik: string, patch: Partial<DraftItem>) =>
    setMeals((ms) =>
      ms!.map((m) => (m.key === mk ? { ...m, items: m.items.map((i) => (i.key === ik ? { ...i, ...patch } : i)) } : m)),
    );

  return (
    <section className="flex flex-col gap-4 rounded-[28px] border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="section-title">Crea dal piano dieta</h2>
        <p className="text-sm text-muted-foreground">
          Carica il PDF o una foto del piano: l&apos;AI propone i pasti tipo, tu li controlli e li confermi.
        </p>
      </div>

      {!meals && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-file">PDF o foto del piano</Label>
            <input
              id="plan-file"
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:h-11 file:rounded-full file:border-0 file:bg-ink file:px-4 file:font-semibold file:text-paper"
            />
          </div>
          <div className="flex items-start gap-3 rounded-[20px] bg-warning/10 p-3 text-sm">
            <Checkbox id="plan-privacy" checked={privacy} onCheckedChange={(v) => setPrivacy(v === true)} className="mt-0.5" />
            <Label htmlFor="plan-privacy" className="leading-relaxed font-normal">
              Ho coperto nome, peso, esami e altri dati personali del paziente. Il file viene letto dall&apos;AI e non
              viene salvato.
            </Label>
          </div>
          <Button type="button" onClick={read} disabled={pending || !file || !privacy} className="h-12 rounded-full text-base">
            <FileUp aria-hidden />
            {pending ? "Lettura in corso… (fino a un minuto)" : "Leggi il piano"}
          </Button>
        </div>
      )}

      {meals && (
        <div className="flex flex-col gap-5">
          <p className="rounded-[20px] bg-lemon p-3 text-sm text-ink">
            <strong>Controlla tutto prima di confermare:</strong> l&apos;AI può sbagliare a leggere. Niente è salvato
            finché non premi &quot;Crea pasti tipo&quot;.
          </p>
          {warnings.length > 0 && (
            <ul className="flex list-disc flex-col gap-1 rounded-[20px] bg-warning/10 p-3 pl-7 text-sm">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          {meals.map((m) => (
            <div key={m.key} className="flex flex-col gap-3 rounded-[24px] border bg-white/60 p-4">
              <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Label htmlFor={`n-${m.key}`}>Nome</Label>
                  <Input id={`n-${m.key}`} value={m.name} maxLength={60} onChange={(e) => patchMeal(m.key, { name: e.target.value })} className="h-11 text-base" />
                </div>
                <select
                  aria-label="Momento"
                  value={m.slot}
                  onChange={(e) => patchMeal(m.key, { slot: e.target.value as "pranzo" | "cena" })}
                  className="h-11 rounded-lg border border-input bg-white/70 px-3 text-base"
                >
                  <option value="pranzo">Pranzo</option>
                  <option value="cena">Cena</option>
                </select>
                <Button type="button" variant="ghost" size="icon" aria-label={`Togli ${m.name}`} onClick={() => setMeals((ms) => ms!.filter((x) => x.key !== m.key))}>
                  <Trash2 aria-hidden />
                </Button>
              </div>

              {m.items.map((i) => (
                <div key={i.key} className="flex flex-col gap-2 border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    Nel piano: <strong className="text-foreground">{i.food || "—"}</strong>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Base per ${i.food}`}
                      value={i.base_id}
                      onChange={(e) => patchItem(m.key, i.key, { base_id: e.target.value })}
                      className={`h-11 min-w-0 flex-1 rounded-lg border px-3 text-base ${i.base_id ? "border-input bg-white/70" : "border-destructive bg-destructive/5"}`}
                    >
                      <option value="">Scegli la base…</option>
                      {byCategory.map((c) => (
                        <optgroup key={c.value} label={c.label}>
                          {c.bases.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={1000}
                      aria-label={`Grammi di ${i.food}`}
                      value={i.grams}
                      onChange={(e) => patchItem(m.key, i.key, { grams: Math.max(1, Math.min(1000, Number(e.target.value) || 0)) })}
                      className="h-11 w-24 text-base"
                    />
                    <span className="text-sm text-muted-foreground">g</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={50}
                      placeholder="—"
                      aria-label="Gruppo di alternative (vuoto se fissa)"
                      title="Stesso numero = alternative tra cui il paziente sceglie. Vuoto = base fissa."
                      value={i.choice_group ?? ""}
                      onChange={(e) => patchItem(m.key, i.key, { choice_group: e.target.value ? Number(e.target.value) : null })}
                      className="h-11 w-16 text-base"
                    />
                    <Button type="button" variant="ghost" size="icon" aria-label={`Togli ${i.food}`} onClick={() => patchMeal(m.key, { items: m.items.filter((x) => x.key !== i.key) })}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start rounded-full"
                onClick={() => patchMeal(m.key, { items: [...m.items, { key: k(), base_id: "", food: "", grams: 100, choice_group: null }] })}
              >
                <Plus aria-hidden /> Aggiungi una base
              </Button>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            Il numero nel campo piccolo è il gruppo di alternative: stesso numero = il paziente sceglie una di quelle basi.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={pending || meals.length === 0} className="h-12 rounded-full text-base">
              {pending ? "Creazione…" : `Crea ${meals.length} ${meals.length === 1 ? "pasto tipo" : "pasti tipo"}`}
            </Button>
            <Button type="button" variant="outline" onClick={() => setMeals(null)} disabled={pending} className="h-12 rounded-full">
              Annulla
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="text-sm font-semibold text-ok">
          {ok}
        </p>
      )}
    </section>
  );
}
