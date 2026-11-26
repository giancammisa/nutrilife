import { Award, Flame, Lock, Sparkles, Star } from "lucide-react";
import { RoleArea } from "@/components/role-area";
import { requireProfile } from "@/lib/auth";
import { getRewards, WEEK_TARGET } from "@/lib/rewards";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";
import { ShareCard } from "./share-button";
import { StoryMaker } from "./story-maker";

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
      <section className="relative isolate flex flex-col gap-4 overflow-hidden rounded-[32px] bg-ink p-6 text-paper">
        {/* aura che respira dietro la serie */}
        <span aria-hidden className="aura-blob -top-10 -left-10 -z-10 size-48 bg-[#FF9A78]/60" />
        <span aria-hidden className="aura-blob top-16 -right-12 -z-10 size-44 bg-sage/50 [animation-delay:-3s]" />
        <span aria-hidden className="aura-blob -bottom-16 left-1/3 -z-10 size-40 bg-lemon/40 [animation-delay:-5s]" />
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-paper/80">
            <Flame className="size-4 text-lemon" aria-hidden /> Serie
          </span>
          <span className="twinkle inline-flex size-11 items-center justify-center rounded-full bg-lemon text-ink">
            <Star className="size-5 fill-ink" aria-hidden />
          </span>
        </div>
        <p className="flex items-baseline gap-3">
          <span className="display text-7xl text-lemon">
            <CountUp value={r.streakWeeks} />
          </span>
          <span className="card-title">{r.streakWeeks === 1 ? "settimana di fila" : "settimane di fila"}</span>
        </p>
        <p className="text-sm text-paper/75">
          Questa settimana {Math.min(r.thisWeek, WEEK_TARGET)} di {WEEK_TARGET}: una settimana conta quando ritiri almeno{" "}
          {WEEK_TARGET} pasti verificati.
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: WEEK_TARGET }).map((_, i) => (
            <span key={i} className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/15">
              {i < r.thisWeek && (
                <span className="grow-x block h-full rounded-full bg-lemon" style={{ animationDelay: `${200 + i * 180}ms` }} />
              )}
            </span>
          ))}
        </div>
      </section>

      {/* numeri */}
      <section className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-[24px] bg-grad-lime p-4 text-ink">
          <span className="display text-4xl">
            <CountUp value={r.verifiedMeals} />
          </span>
          <span className="text-sm font-semibold">pasti verificati</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[24px] bg-grad-leaf p-4 text-ink">
          <span className="display text-4xl">
            <CountUp value={r.totalVegKg} decimals={1} />
          </span>
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
        <StoryMaker />
      </section>

      {/* traguardi */}
      <section className="flex flex-col gap-3">
        <h2 className="section-title">Traguardi</h2>
        <ul className="grid grid-cols-2 gap-3">
          {r.milestones.map((m, idx) => (
            <li
              key={m.id}
              className={cn(
                "pop-in relative flex flex-col gap-2 rounded-[24px] p-4",
                m.done ? "bg-grad-lime text-ink" : "border bg-card",
              )}
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              <span
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-full",
                  m.done ? "bg-ink text-lemon" : "bg-muted text-muted-foreground",
                )}
              >
                {m.done ? <Award className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
              </span>
              {m.done && <Sparkles aria-hidden className="twinkle absolute top-3 right-3 size-5 text-ink" />}
              <span className="text-base leading-tight font-semibold">{m.title}</span>
              <span className={cn("text-xs", m.done ? "text-ink/70" : "text-muted-foreground")}>{m.detail}</span>
              {!m.done && (
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10" aria-hidden>
                  <span
                    className="grow-x block h-full rounded-full bg-ink"
                    style={{ width: `${Math.round(m.progress * 100)}%`, animationDelay: `${300 + idx * 70}ms` }}
                  />
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
