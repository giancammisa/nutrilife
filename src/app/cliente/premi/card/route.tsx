import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { requireProfile } from "@/lib/auth";
import { getRewards, type Rewards } from "@/lib/rewards";

// Solo in sviluppo: ?demo=1 mostra la card con numeri finti, senza accesso.
const DEMO: Rewards = {
  verifiedMeals: 18,
  streakWeeks: 4,
  thisWeek: 2,
  monthMeals: 11,
  monthKg: { proteina: 1.6, carboidrato: 0.9, verdura: 2.2, frutta: 0 },
  totalVegKg: 6.4,
  milestones: [{ id: "mese", title: "Un mese di fila", detail: "", done: true, progress: 1 }],
};

// Card verticale (storie di Instagram, 1080×1920) con i progressi del cliente.
// Solo numeri di costanza calcolati qui: niente nome, niente allergie, niente peso.

export const runtime = "nodejs";

const INK = "#0B0B0B";
const SALVIA = "#DFE6DA";
const LIME = "#EDFF8C";
const SAGE = "#9EE6A0";
const ROSE = "#F4B3AC";

const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

async function font(weight: number) {
  const file = path.join(process.cwd(), "node_modules/@fontsource/urbanist/files", `urbanist-latin-${weight}-normal.woff`);
  return readFile(file);
}

const kg = (n: number) => n.toFixed(1).replace(".", ",");

export async function GET(request: NextRequest) {
  const demo = process.env.NODE_ENV === "development" && request.nextUrl.searchParams.get("demo") === "1";
  const r = demo ? DEMO : await getRewards((await requireProfile(["cliente"])).id);
  const tipo = request.nextUrl.searchParams.get("tipo") ?? "serie";
  const month = MONTHS[Number(new Date().toISOString().slice(5, 7)) - 1];

  let big = String(r.streakWeeks);
  let label = r.streakWeeks === 1 ? "settimana di fila" : "settimane di fila";
  let sub = "rispettando il piano del mio nutrizionista";
  if (tipo === "pasti") {
    big = String(r.verifiedMeals);
    label = r.verifiedMeals === 1 ? "pasto verificato" : "pasti verificati";
    sub = "preparati secondo il mio nutrizionista";
  } else if (tipo === "mese") {
    big = String(r.monthMeals);
    label = r.monthMeals === 1 ? `pasto a ${month}` : `pasti a ${month}`;
    sub = "verificati dal mio nutrizionista";
  } else if (tipo === "traguardo") {
    const m = r.milestones.find((x) => x.id === request.nextUrl.searchParams.get("id") && x.done);
    big = "✓";
    label = m ? m.title : "Traguardo";
    sub = "con il piano del mio nutrizionista";
  }

  // Numeri sotto la card, senza ripetere quello grande
  const pills = [
    tipo !== "pasti" && `${r.verifiedMeals} pasti verificati`,
    `${kg(r.totalVegKg)} kg di verdure`,
    tipo !== "serie" && `${r.streakWeeks} ${r.streakWeeks === 1 ? "settimana" : "settimane"} di fila`,
  ].filter((p): p is string => Boolean(p));

  const [light, semi, bold] = await Promise.all([font(300), font(600), font(700)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: SALVIA,
          padding: "110px 90px 120px",
          fontFamily: "Urbanist",
          color: INK,
        }}
      >
        {/* intestazione */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 84, fontWeight: 700, letterSpacing: -3 }}>NutriLife</span>
            <span style={{ fontSize: 44, fontWeight: 300 }}>
              <b style={{ fontWeight: 600 }}>Cucina</b>&nbsp;3.0
            </span>
          </div>
          <div style={{ display: "flex", position: "relative", width: 190, height: 170 }}>
            <div style={{ position: "absolute", left: 0, top: 50, width: 120, height: 120, borderRadius: 999, background: SAGE, border: `8px solid ${INK}` }} />
            <div style={{ position: "absolute", left: 100, top: 0, width: 80, height: 80, borderRadius: 999, background: LIME, border: `8px solid ${INK}` }} />
            <div style={{ position: "absolute", left: 120, top: 100, width: 64, height: 64, borderRadius: 999, background: ROSE, border: `8px solid ${INK}` }} />
          </div>
        </div>

        {/* cerchi grandi del pasto con il numero */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ position: "absolute", left: -40, top: 120, width: 560, height: 560, borderRadius: 999, background: SAGE }} />
          <div style={{ position: "absolute", right: -20, top: 40, width: 380, height: 380, borderRadius: 999, background: LIME }} />
          <div style={{ position: "absolute", left: 40, bottom: -10, width: 340, height: 340, borderRadius: 999, background: ROSE }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: INK,
              color: "#F5F5F4",
              borderRadius: 64,
              padding: "70px 80px 80px",
              width: 820,
            }}
          >
            <span style={{ fontSize: big.length > 3 ? 220 : 300, fontWeight: 300, lineHeight: 1, color: LIME, letterSpacing: -10 }}>
              {big}
            </span>
            <span style={{ fontSize: 76, fontWeight: 600, marginTop: 10, textAlign: "center", letterSpacing: -2 }}>{label}</span>
            <span style={{ fontSize: 40, fontWeight: 300, marginTop: 24, textAlign: "center", color: "rgba(245,245,244,0.75)" }}>
              {sub}
            </span>
          </div>
        </div>

        {/* numeri */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", marginBottom: 60 }}>
          {pills.map((p) => (
            <span
              key={p}
              style={{ display: "flex", background: "rgba(255,255,255,0.75)", borderRadius: 999, padding: "18px 34px", fontSize: 38, fontWeight: 600 }}
            >
              {p}
            </span>
          ))}
        </div>

        <span style={{ display: "flex", justifyContent: "center", fontSize: 36, fontWeight: 300 }}>
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
