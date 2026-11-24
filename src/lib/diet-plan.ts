import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

// Lettura di un piano dieta (PDF o foto) con Claude: propone i pasti tipo con basi del catalogo.
// Il file non viene salvato da nessuna parte: arriva qui, si manda a Claude, si scarta.
// Il risultato è solo una PROPOSTA: il nutrizionista la rivede e la conferma.

export const MAX_FILE_BYTES = 4 * 1024 * 1024; // Vercel accetta richieste fino a ~4,5 MB
export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
type Accepted = (typeof ACCEPTED_TYPES)[number];

const PlanSchema = z.object({
  meals: z
    .array(
      z.object({
        name: z.string().describe("Nome breve del pasto, es. 'Pranzo A' o 'Cena 2'"),
        slot: z.enum(["pranzo", "cena"]),
        items: z.array(
          z.object({
            base_id: z
              .string()
              .nullable()
              .describe("id della base del catalogo che corrisponde all'alimento, oppure null se non c'è"),
            food: z.string().describe("Alimento come scritto nel piano"),
            grams: z.number().int().describe("Grammi del peso cotto/pronto se indicato, altrimenti quelli scritti"),
            choice_group: z
              .number()
              .int()
              .nullable()
              .describe("Stesso numero per alimenti alternativi tra loro (es. 'pollo oppure pesce'), null se fisso"),
          }),
        ),
      }),
    )
    .describe("Solo pranzi e cene"),
  warnings: z.array(z.string()).describe("Dubbi di lettura da far controllare al nutrizionista, in italiano"),
});

export type ExtractedPlan = z.infer<typeof PlanSchema>;
export type Base = { id: string; name: string; category: string };

const SYSTEM = `Leggi piani dieta di nutrizionisti italiani per un servizio che fa cucinare e pesare i pasti da laboratori artigiani.
Estrai SOLO pranzi e cene come "pasti tipo" (ignora colazione, spuntini, integratori, consigli generali).
Per ogni alimento scegli la base del catalogo più corrispondente e usa il suo id esatto; se nessuna corrisponde davvero, base_id = null.
I grammi devono essere quelli scritti nel piano; non inventare quantità. Se il piano indica peso crudo, riportalo e aggiungi un avviso.
Alternative ("oppure", "/", "a scelta"): stesso choice_group per gli alimenti tra cui il paziente sceglie.
Non riportare mai nome, peso corporeo, esami o altri dati personali del paziente.
Scrivi gli avvisi in italiano semplice.`;

export async function extractDietPlan(
  file: { data: string; mediaType: Accepted },
  catalog: Base[],
): Promise<{ plan: ExtractedPlan } | { error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "La lettura automatica non è ancora attiva: manca la chiave dell'AI (ANTHROPIC_API_KEY)." };
  }
  const client = new Anthropic({ timeout: 120_000, maxRetries: 1 });

  const fileBlock: Anthropic.Beta.BetaContentBlockParam =
    file.mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.data } }
      : { type: "image", source: { type: "base64", media_type: file.mediaType, data: file.data } };

  const catalogText = catalog.map((b) => `${b.id} | ${b.name} | ${b.category}`).join("\n");

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(PlanSchema) },
      system: [{ type: "text", text: SYSTEM }],
      messages: [
        {
          role: "user",
          content: [
            fileBlock,
            {
              type: "text",
              text: `Catalogo delle basi (id | nome | categoria):\n${catalogText}\n\nEstrai i pasti tipo da questo piano.`,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { error: "L'AI non ha potuto leggere questo documento. Prova con un altro file o inserisci i pasti a mano." };
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      return { error: "Il piano è troppo lungo o non leggibile. Prova con una foto più nitida o un PDF più corto." };
    }

    // Tieni solo id davvero presenti nel catalogo e grammi sensati
    const ids = new Set(catalog.map((b) => b.id));
    const plan = response.parsed_output;
    for (const m of plan.meals) {
      for (const i of m.items) {
        if (i.base_id && !ids.has(i.base_id)) i.base_id = null;
        i.grams = Math.min(1000, Math.max(1, Math.round(i.grams)));
      }
    }
    return { plan };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { error: "La chiave dell'AI non è valida: controllala in Vercel." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { error: "Troppe richieste all'AI in poco tempo. Riprova tra un minuto." };
    }
    if (error instanceof Anthropic.BadRequestError) {
      return { error: "Il file non è stato accettato (formato o dimensione). Prova con un PDF o una foto JPG." };
    }
    if (error instanceof Anthropic.APIError) {
      return { error: "Il servizio AI non risponde in questo momento. Riprova tra poco." };
    }
    return { error: "Lettura non riuscita. Riprova." };
  }
}
