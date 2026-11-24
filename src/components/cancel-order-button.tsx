"use client";

import { useActionState, useState } from "react";
import { cancelOrder } from "@/app/cliente/actions";
import type { FormState } from "@/lib/form";
import { Button } from "@/components/ui/button";

// "Annulla" in due passaggi: prima chiede conferma, poi annulla.
export function CancelOrderButton({ orderId, label, parts = 1 }: { orderId: string; label: string; parts?: number }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(cancelOrder, { error: null, ok: null });

  if (state.ok) return <p className="text-sm text-muted-foreground">{state.ok}</p>;

  return (
    <div className="flex flex-col gap-2">
      {!confirming ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-destructive"
          onClick={() => setConfirming(true)}
        >
          Annulla ordine
        </Button>
      ) : (
        <form action={action} className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-3">
          <input type="hidden" name="order_id" value={orderId} />
          <p className="text-sm">
            Vuoi annullare {label}?{parts > 1 && ` Si annullano tutte le ${parts} parti, nei ${parts} punti vendita.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="destructive" size="sm" className="rounded-full" disabled={pending}>
              {pending ? "Annullamento…" : "Sì, annulla"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              No, tienilo
            </Button>
          </div>
        </form>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </div>
  );
}
