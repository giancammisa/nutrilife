"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Condividi la card nelle storie: sul telefono apre Instagram, WhatsApp…; altrimenti la scarica.
export function ShareCard({ href, label = "Condividi" }: { href: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function share() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(href, { cache: "no-store" });
      if (!res.ok) throw new Error("card");
      const blob = await res.blob();
      const file = new File([blob], "nutrilife-progressi.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "I miei progressi con NutriLife" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "nutrilife-progressi.png";
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
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={share} disabled={busy} className="h-12 rounded-full text-base">
        {busy ? <Download aria-hidden /> : <Share2 aria-hidden />}
        {busy ? "Preparo l'immagine…" : label}
      </Button>
      {note && (
        <p role="status" className="text-sm text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );
}
