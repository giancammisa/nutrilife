/* eslint-disable @next/next/no-img-element -- immagine generata dal server (next/og), non una pagina */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { requireProfile } from "@/lib/auth";
import { getRewards, type Rewards } from "@/lib/rewards";
import { auraSvg, CREAM, INK, LIME, ringSvg, svgData } from "./aura";

// Solo in sviluppo: ?demo=1 mostra la card con numeri finti, senza accesso.
const DEMO: Rewards = {
  meals: 18,
  points: 260,
  streakWeeks: 4,
  thisWeek: 2,
  monthMeals: 11,
  monthKg: { proteina: 1.6, carboidrato: 0.9, verdura: 2.2, frutta: 0 },
  golds: [{ id: "demo", awardedOn: "2026-11-20", nutritionist: null }],
  milestones: [{ id: "mese", title: "Un mese di fila", detail: "", done: true, progress: 1 }],
};

// Card verticale (storie di Instagram, 1080×1920) con i progressi del cliente.
// Solo numeri di costanza calcolati qui: niente nome, niente allergie, niente peso.

export const runtime = "nodejs";


const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

async function font(weight: number) {
  const file = path.join(process.cwd(), "node_modules/@fontsource/urbanist/files", `urbanist-latin-${weight}-normal.woff`);
  return readFile(file);
}

export async function GET(request: NextRequest) {
  const demo = process.env.NODE_ENV === "development" && request.nextUrl.searchParams.get("demo") === "1";
  const r = demo ? DEMO : await getRewards((await requireProfile(["cliente"])).id);
  const tipo = request.nextUrl.searchParams.get("tipo") ?? "serie";
  // fondo=foto: solo grafica su fondo trasparente; la foto la mette il telefono (non arriva mai qui)
  const photo = request.nextUrl.searchParams.get("fondo") === "foto";
  const paper = "#F5F5F4";
  const month = MONTHS[Number(new Date().toISOString().slice(5, 7)) - 1];

  let big = String(r.streakWeeks);
  let label = r.streakWeeks === 1 ? "settimana di fila" : "settimane di fila";
  let sub = "di pasti pesati al grammo";
  if (tipo === "pasti") {
    big = String(r.meals);
    label = r.meals === 1 ? "pasto pesato" : "pasti pesati";
    sub = "preparati al grammo per me";
  } else if (tipo === "mese") {
    big = String(r.monthMeals);
    label = r.monthMeals === 1 ? `pasto a ${month}` : `pasti a ${month}`;
    sub = "pesati al grammo";
  } else if (tipo === "traguardo") {
    const m = r.milestones.find((x) => x.id === request.nextUrl.searchParams.get("id") && x.done);
    big = "✓";
    label = m ? m.title : "Traguardo";
    sub = "un pasto pesato alla volta";
  } else if (tipo === "gold") {
    const g = r.golds.find((x) => x.id === request.nextUrl.searchParams.get("id"));
    if (!g) return new Response("Non trovato", { status: 404 });
    big = "Gold";
    label = "Obiettivo raggiunto";
    sub = "valutato dal mio nutrizionista";
  }

  // Numeri sotto la card, senza ripetere quello grande
  const pills = [
    tipo !== "pasti" && `${r.meals} ${r.meals === 1 ? "pasto" : "pasti"}`,
    `${r.points} punti`,
    tipo !== "serie" && `${r.streakWeeks} ${r.streakWeeks === 1 ? "settimana" : "settimane"} di fila`,
  ].filter((p): p is string => Boolean(p));

  // Avanzamento verso il prossimo traguardo: riempie l'anello e fa crescere la luce al centro
  const next = (n: number, steps: number[]) => {
    const target = steps.find((x) => x > n) ?? steps[steps.length - 1];
    return Math.min(1, n / target);
  };
  const progress =
    tipo === "pasti"
      ? next(r.meals, [10, 25, 50, 100, 200])
      : tipo === "mese"
        ? Math.min(1, r.monthMeals / 20)
        : tipo === "traguardo" || tipo === "gold"
          ? 1
          : next(r.streakWeeks, [4, 12, 26, 52]);

  const [light, semi, bold] = await Promise.all([font(300), font(600), font(700)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          fontFamily: "Urbanist",
          color: INK,
          background: photo ? "transparent" : CREAM,
        }}
      >
        {photo ? (
          <>
            {/* velature scure in alto e in basso per leggere bene sopra qualsiasi foto */}
            <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 520, background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0))" }} />
            <div style={{ position: "absolute", left: 0, top: 1560, width: 1080, height: 360, background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.72))" }} />
          </>
        ) : (
          /* aura: sagoma sfumata con la luce dei progressi (disegno originale) */
          <img src={svgData(auraSvg(progress))} width={1080} height={1920} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
        )}

        {/* intestazione */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "100px 90px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", color: photo ? paper : INK }}>
            <span style={{ fontSize: 80, fontWeight: 700, letterSpacing: -3 }}>NutriLife</span>
            <span style={{ fontSize: 42, fontWeight: 300 }}>
              <b style={{ fontWeight: 600 }}>Cucina</b>&nbsp;3.0
            </span>
          </div>
          {/* stellina */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 150, height: 150, borderRadius: 999, background: INK }}>
            <svg width="92" height="92" viewBox="0 0 24 24">
              <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill={LIME} />
            </svg>
          </div>
        </div>

        {/* anello con il numero, sul petto della sagoma */}
        <div style={{ display: "flex", position: "absolute", left: 210, top: 640, width: 660, height: 660 }}>
          <img src={svgData(ringSvg(progress, photo))} width={660} height={660} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 660, height: 660 }}>
            <span style={{ fontSize: big.length > 3 ? 200 : 270, fontWeight: 300, lineHeight: 1, letterSpacing: -10 }}>{big}</span>
          </div>
        </div>

        {/* testo e numeri in basso, su vetro bianco */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "absolute",
            left: 80,
            right: 80,
            top: 1360,
            padding: "44px 40px 48px",
            borderRadius: 56,
            background: "rgba(255,255,255,0.62)",
          }}
        >
          <span style={{ fontSize: 76, fontWeight: 600, textAlign: "center", letterSpacing: -2 }}>{label}</span>
          <span style={{ fontSize: 38, fontWeight: 300, marginTop: 12, textAlign: "center" }}>{sub}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginTop: 30 }}>
            {pills.map((p) => (
              <span
                key={p}
                style={{ display: "flex", background: INK, color: "#F5F5F4", borderRadius: 999, padding: "14px 28px", fontSize: 34, fontWeight: 600 }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <span style={{ display: "flex", position: "absolute", left: 0, right: 0, bottom: 70, justifyContent: "center", fontSize: 34, fontWeight: photo ? 600 : 300, color: photo ? paper : INK }}>
          Pesato al grammo da laboratori artigiani vicino a te
        </span>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        { name: "Urbanist", data: light, weight: 300, style: "normal" },
        { name: "Urbanist", data: semi, weight: 600, style: "normal" },
        { name: "Urbanist", data: bold, weight: 700, style: "normal" },
      ],
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
