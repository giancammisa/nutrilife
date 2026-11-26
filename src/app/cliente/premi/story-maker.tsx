"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageOff, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Card per le storie: sfondo "aura" (dal server) oppure una foto del cliente.
// Con la foto, tutto si compone QUI sul telefono: la foto non viene mai caricata.

const KINDS = [
  { id: "serie", label: "Serie" },
  { id: "pasti", label: "Pasti" },
  { id: "mese", label: "Mese" },
] as const;
type Kind = (typeof KINDS)[number]["id"];

const W = 1080;
const H = 1920;
// Cerchio del punteggio nella card (stesse misure del server: anello 660px a 210,640)
const CX = 540;
const CY = 970;
const R = 279;

function drawCover(ctx: CanvasRenderingContext2D, img: ImageBitmap) {
  const scale = Math.max(W / img.width, H / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

async function loadBitmap(blob: Blob) {
  return createImageBitmap(blob);
}

async function compose(photo: File, overlayUrl: string): Promise<Blob> {
  const [photoBmp, overlayBlob] = await Promise.all([
    loadBitmap(photo),
    fetch(overlayUrl, { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error("card");
      return r.blob();
    }),
  ]);
  const overlay = await loadBitmap(overlayBlob);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  drawCover(ctx, photoBmp);

  // Cerchio di vetro smerigliato: la stessa foto, sfocata e schiarita, dentro il cerchio
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.clip();
  if ("filter" in ctx) ctx.filter = "blur(28px) saturate(140%)";
  drawCover(ctx, photoBmp);
  ctx.filter = "none";
  const glass = ctx.createLinearGradient(CX - R, CY - R, CX + R, CY + R);
  glass.addColorStop(0, "rgba(255,255,255,0.62)");
  glass.addColorStop(0.5, "rgba(255,255,255,0.38)");
  glass.addColorStop(1, "rgba(255,255,255,0.55)");
  ctx.fillStyle = glass;
  ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
  ctx.restore();

  ctx.drawImage(overlay, 0, 0, W, H);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/jpeg", 0.9),
  );
}

export function StoryMaker() {
  const [kind, setKind] = useState<Kind>("serie");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const auraUrl = `/cliente/premi/card?tipo=${kind}`;
  const overlayUrl = `/cliente/premi/card?tipo=${kind}&fondo=foto`;

  // Anteprima con la foto (composta sul telefono)
  useEffect(() => {
    if (!photo) return;
    let url: string | null = null;
    let cancelled = false;
    compose(photo, overlayUrl)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPreview(url);
      })
      .catch(() => !cancelled && setNote("Non sono riuscito a usare questa foto. Provane un'altra."));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [photo, overlayUrl]);

  async function share() {
    setBusy(true);
    setNote(null);
    try {
      const blob = photo
        ? await compose(photo, overlayUrl)
        : await fetch(auraUrl, { cache: "no-store" }).then((r) => {
            if (!r.ok) throw new Error("card");
            return r.blob();
          });
      const ext = photo ? "jpg" : "png";
      const file = new File([blob], `nutrilife-progressi.${ext}`, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "I miei progressi con NutriLife" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setNote("Immagine scaricata: caricala nelle tue storie.");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setNote("Non sono riuscito a preparare l'immagine. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cosa condividere">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="radio"
            aria-checked={kind === k.id}
            onClick={() => setKind(k.id)}
            className={cn(
              "inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
              kind === k.id ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white/70 hover:bg-white",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- anteprima generata (server o telefono) */}
        <img
          src={photo && preview ? preview : auraUrl}
          alt="Anteprima della card da condividere"
          width={270}
          height={480}
          className="aspect-[9/16] w-36 shrink-0 rounded-[18px] border object-cover"
        />
        <div className="flex flex-1 flex-col justify-end gap-2">
          <input
            ref={input}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            aria-label="Scatta o scegli una foto per lo sfondo"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setNote(null);
              setPreview(null);
              setPhoto(f);
            }}
          />
          <Button type="button" variant="outline" className="h-12 rounded-full" onClick={() => input.current?.click()}>
            <Camera aria-hidden />
            {photo ? "Cambia foto" : "Foto come sfondo"}
          </Button>
          {photo && (
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setPhoto(null);
                setPreview(null);
                if (input.current) input.current.value = "";
              }}
            >
              <ImageOff aria-hidden /> Sfondo NutriLife
            </Button>
          )}
          <Button type="button" onClick={share} disabled={busy || Boolean(photo && !preview)} className="h-12 rounded-full text-base">
            <Share2 aria-hidden />
            {busy ? "Preparo…" : "Condividi"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        La foto resta sul tuo telefono: la card si crea qui e non viene caricata da nessuna parte.
      </p>
      {note && (
        <p role="status" className="text-sm text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );
}
