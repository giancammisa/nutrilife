"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "code";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(
        error.status === 429
          ? "Troppi tentativi. Aspetta qualche minuto e riprova."
          : "Non siamo riusciti a inviare il codice. Controlla l'email e riprova.",
      );
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setLoading(false);
    if (error) {
      setError("Codice non valido o scaduto. Controlla l'email o chiedine uno nuovo.");
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  if (step === "email") {
    return (
      <form onSubmit={sendCode} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">La tua email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="nome@email.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="h-12 rounded-full text-base" disabled={loading}>
          {loading ? "Invio in corso…" : "Ricevi il codice"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Niente password: ti mandiamo un codice via email.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="flex flex-col gap-4">
      <p className="text-muted-foreground">
        Abbiamo inviato un codice a <span className="font-medium text-foreground">{email}</span>.
        Controlla anche lo spam.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Codice</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,8}"
          maxLength={8}
          required
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="h-12 text-center text-2xl tracking-[0.4em]"
        />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="h-12 rounded-full text-base" disabled={loading}>
        {loading ? "Verifica…" : "Entra"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setStep("email");
          setCode("");
          setError(null);
        }}
      >
        Usa un&apos;altra email
      </Button>
    </form>
  );
}
