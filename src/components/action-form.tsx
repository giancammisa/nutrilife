"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import { Button } from "@/components/ui/button";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

// Modulo con messaggio di esito (errore o conferma) sotto i campi.
export function ActionForm({
  action,
  submitLabel,
  pendingLabel = "Salvataggio…",
  resetOnSuccess = false,
  children,
}: {
  action: Action;
  submitLabel: string;
  pendingLabel?: string;
  resetOnSuccess?: boolean;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {
    error: null,
    ok: null,
  });

  return (
    <form
      action={formAction}
      // Dopo un salvataggio riuscito, il modulo "nuovo" si svuota da solo.
      key={resetOnSuccess && state.ok ? state.ok : undefined}
      className="flex flex-col gap-4"
    >
      {children}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-primary">
          {state.ok}
        </p>
      )}
      <Button type="submit" className="h-11 rounded-full" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
