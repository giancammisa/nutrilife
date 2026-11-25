import Image from "next/image";
import { Award, Flame, Lock } from "lucide-react";
import { RoleArea } from "@/components/role-area";
import { requireProfile } from "@/lib/auth";
import { getRewards, WEEK_TARGET } from "@/lib/rewards";
import { cn } from "@/lib/utils";
import { ShareCard } from "./share-button";

export const metadata = { title: "I miei progressi · NutriLife" };

const kg = (n: number) => n.toFixed(1).replace(".", ",");

// Progressi stile Strava: costanza con i pasti del nutrizionista, mai il peso.
export default async function PremiPage() {
  const profile = await requireProfile(["cliente"]);
  const r = await getRewards(profile.id);

  return (
    <RoleArea profile={profile} title="I miei progressi" back={{ href: "/cliente", label: "La mia settimana" }}>
      <p className="text-muted-foreground">
        Contano i pasti <strong className="text-foreground">verificati dal nutrizionista</strong> che hai ritirato.
        Niente peso, niente bilancia: solo la tua costanza.
      </p>

      {/* serie */}
      <section className="flex flex-col gap-4 rounded-[32px] bg-ink p-6 text-paper">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-paper/80">
            <Flame className="size-4 text-lemon" aria-hidden /> Serie
          </span>
          <span className="text-xs text-paper/70">
            Questa settimana {r.thisWeek} di {WEEK_TARGET}
          </span>
        </div>
        <p className="flex items-baseline gap-3">
          <span className="display text-7xl text-lemon">{r.streakWeeks}</span>
          <span className="card-title">{r.streakWeeks === 1 ? "settimana di fila" : "settimane di fila"}</span>
        </p>
        <p className="text-sm text-paper/75">
          Una settimana conta quando ritiri almeno {WEEK_TARGET} pasti verificati.
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: WEEK_TARGET }).map((_, i) => (
            <span key={i} className={cn("h-2 flex-1 rounded-full", i < r.thisWeek ? "bg-lemon" : "bg-white/15")} />
          ))}
        </div>
      </section>

      {/* numeri */}
      <section className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-[24px] bg-grad-lime p-4 text-ink">
          <span className="display text-4xl">{r.verifiedMeals}</span>
          <span className="text-sm font-semibold">pasti verificati</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[24px] bg-grad-leaf p-4 text-ink">
          <span className="display text-4xl">{kg(r.totalVegKg)}</span>
          <span className="text-sm font-semibold">kg di verdure</span>
        </div>
        <div className="col-span-2 flex flex-col gap-2 rounded-[24px] border bg-card p-4">
          <span className="text-sm font-semibold">Questo mese: {r.monthMeals} pasti verificati</span>
          <span className="text-sm text-muted-foreground">
            Proteine {kg(r.monthKg.proteina)} kg · carboidrati {kg(r.monthKg.carboidrato)} kg · verdure{" "}
            {kg(r.monthKg.verdura)} kg{r.monthKg.frutta > 0 ? ` · frutta ${kg(r.monthKg.frutta)} kg` : ""}
          </span>
        </div>
      </section>

      {/* card da condividere */}
      <section className="flex flex-col gap-4 rounded-[28px] border bg-card p-5">
        <div className="flex flex-col gap-1">
          <h2 className="section-title">Condividi nelle storie</h2>
          <p className="text-sm text-muted-foreground">
            Un&apos;immagine verticale con i tuoi numeri. Non contiene il tuo nome, le allergie o il nutrizionista.
          </p>
        </div>
        <div className="flex gap-3">
          <Image
            src="/cliente/premi/card?tipo=serie"
            alt="Anteprima della card con la tua serie"
            width={270}
            height={480}
            unoptimized
            className="w-36 shrink-0 rounded-[18px] border"
          />
          <div className="flex flex-1 flex-col justify-end gap-2">
            <ShareCard href="/cliente/premi/card?tipo=serie" label="Condividi la serie" />
            <ShareCard href="/cliente/premi/card?tipo=pasti" label="Condividi i pasti" />
            <ShareCard href="/cliente/premi/card?tipo=mese" label="Condividi il mese" />
          </div>
        </div>
      </section>

      {/* traguardi */}
      <section className="flex flex-col gap-3">
        <h2 className="section-title">Traguardi</h2>
        <ul className="grid grid-cols-2 gap-3">
          {r.milestones.map((m) => (
            <li
              key={m.id}
              className={cn(
                "flex flex-col gap-2 rounded-[24px] p-4",
                m.done ? "bg-grad-lime text-ink" : "border bg-card",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-full",
                  m.done ? "bg-ink text-lemon" : "bg-muted text-muted-foreground",
                )}
              >
                {m.done ? <Award className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
              </span>
              <span className="text-base leading-tight font-semibold">{m.title}</span>
              <span className={cn("text-xs", m.done ? "text-ink/70" : "text-muted-foreground")}>{m.detail}</span>
              {!m.done && (
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10" aria-hidden>
                  <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.round(m.progress * 100)}%` }} />
                </span>
              )}
              {m.done && (
                <ShareCard href={`/cliente/premi/card?tipo=traguardo&id=${m.id}`} label="Condividi" />
              )}
            </li>
          ))}
        </ul>
      </section>
    </RoleArea>
  );
}
