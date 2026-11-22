import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Accedi · NutriLife" };

export default async function AccediPage() {
  if (await getProfile()) redirect("/home");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold">Accedi</h1>
        <p className="text-muted-foreground">Bentornato su NutriLife.</p>
      </div>
      <LoginForm />
    </main>
  );
}
