"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type TestLoginState = { error: string | null };

// SOLO SVILUPPO: accesso con password per gli utenti di prova creati da Supabase.
// Online (NODE_ENV = production) questa azione rifiuta sempre.
export async function testLogin(_prev: TestLoginState, formData: FormData): Promise<TestLoginState> {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Non disponibile." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Inserisci email e password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o password non corrette." };

  redirect("/home");
}
