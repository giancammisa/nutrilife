"use client";

import { useActionState } from "react";
import Link from "next/link";
import { giveConsent, type ConsentState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConsentForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<ConsentState, FormData>(giveConsent, {
    error: null,
  });

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Nome e cognome</Label>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          required
          maxLength={120}
          defaultValue={defaultName}
          placeholder="Mario Rossi"
          className="h-12 text-base"
        />
      </div>

      <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
        <Checkbox id="privacy" name="privacy" required className="mt-0.5" />
        <Label htmlFor="privacy" className="block font-normal leading-relaxed">
          Ho letto l&apos;
          <Link href="/privacy" target="_blank" className="font-medium text-primary underline">
            informativa privacy
          </Link>{" "}
          e acconsento al trattamento dei miei dati per usare NutriLife.
        </Label>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="h-12 rounded-full text-base" disabled={pending}>
        {pending ? "Salvataggio…" : "Continua"}
      </Button>
    </form>
  );
}
