"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "code";

// Traduce gli errori di Supabase in messaggi chiari. Il codice tecnico resta visibile tra parentesi.
function sendErrorMessage(code: string | undefined, message: string): string {
  switch (code) {
    case "over_email_send_rate_limit":
      return "Il servizio email ha raggiunto il limite di invii. Riprova più tardi.";
    case "over_request_rate_limit":
      return "Troppe richieste in poco tempo. Aspetta qualche minuto e riprova.";
    case "email_address_not_authorized":
      return "Per ora le email possono arrivare solo agli indirizzi del team NutriLife.";
    case "email_address_invalid":
      return "Questo indirizzo email non è valido.";
    case "otp_disabled":
    case "signup_disabled":
      return "Le nuove registrazioni sono disattivate.";
    default: {
      // "For security purposes, you can only request this after 42 seconds."
      const seconds = message.match(/after (\d+) seconds?/)?.[1];
      if (seconds) return `Per sicurezza puoi chiedere un nuovo codice tra ${seconds} secondi.`;
      return "Non siamo riusciti a inviare il codice. Controlla l'email e riprova.";
    }
  }
}

export function LoginForm({ initialError }: { initialError?: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        // Se l'email contiene un link invece del codice, riporta qui.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(`${sendErrorMessage(error.code, error.message)} (codice: ${error.code ?? error.status})`);
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
      <form suppressHydrationWarning onSubmit={sendCode} className="flex flex-col gap-4">
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
    <form suppressHydrationWarning onSubmit={verifyCode} className="flex flex-col gap-4">
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
