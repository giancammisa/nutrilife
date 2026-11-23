"use client";

import { useActionState, useState } from "react";
import { createInvite, type InviteState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(createInvite, {
    error: null,
    link: null,
    label: null,
  });
  return (
    <div className="flex flex-col gap-4">
      <form action={action} key={state.link ?? "nuovo"} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="label">Per chi è l&apos;invito</Label>
          <Input id="label" name="label" required maxLength={80} placeholder="Mario R." />
          <p className="text-xs text-muted-foreground">
            Solo per riconoscerlo tu. Il paziente inserirà i suoi dati da solo.
          </p>
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" className="h-11 rounded-full" disabled={pending}>
          {pending ? "Creazione…" : "Crea link d'invito"}
        </Button>
      </form>

      {state.link && <LinkBox key={state.link} link={state.link} label={state.label} />}
    </div>
  );
}

function LinkBox({ link, label }: { link: string; label: string | null }) {
  const [copied, setCopied] = useState(false);
  const message = `Ciao! Ti invito su NutriLife per farti preparare i pasti del tuo piano. Apri questo link: ${link}`;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary bg-primary/5 p-4">
      <p className="text-sm font-medium">Link per {label} (valido 14 giorni, una sola volta)</p>
      <p className="break-all rounded bg-background p-2 font-mono text-xs">{link}</p>
      <p className="text-xs text-muted-foreground">
        Copialo adesso: per sicurezza non potrai più rivederlo.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          }}
        >
          {copied ? "Copiato ✓" : "Copia link"}
        </Button>
        <Button asChild className="rounded-full">
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
            Invia su WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
