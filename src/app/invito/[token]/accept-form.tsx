"use client";

import { useActionState } from "react";
import Link from "next/link";
import { acceptInvite, type AcceptState } from "../actions";
import { Button } from "@/components/ui/button";

export function AcceptForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptInvite, {
    error: null,
    nutritionist: null,
  });

  if (state.nutritionist) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-primary/10 p-4 text-primary">
          Fatto! Ora sei collegato a <strong>{state.nutritionist}</strong>. Troverai qui i pasti tipo
          appena li avrà preparati.
        </p>
        <Button asChild size="lg" className="h-12 rounded-full text-base">
          <Link href="/home">Vai alla tua settimana</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-12 rounded-full text-base" disabled={pending}>
        {pending ? "Un attimo…" : "Accetta l'invito"}
      </Button>
    </form>
  );
}
