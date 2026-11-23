"use client";

import { useActionState } from "react";
import { testLogin, type TestLoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TestLoginForm() {
  const [state, action, pending] = useActionState<TestLoginState, FormData>(testLogin, { error: null });

  return (
    <form suppressHydrationWarning action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email dell&apos;utente di prova</Label>
        <Input id="email" name="email" type="email" required autoComplete="off" className="h-12 text-base" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="off" className="h-12 text-base" />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-12 rounded-full text-base" disabled={pending}>
        {pending ? "Accesso…" : "Entra come utente di prova"}
      </Button>
    </form>
  );
}
