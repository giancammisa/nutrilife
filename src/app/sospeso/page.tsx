import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";

export default async function SospesoPage() {
  const profile = await getProfile();
  if (!profile) redirect("/accedi");
  if (profile.active) redirect("/home");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-extrabold">Account non attivo</h1>
      <p className="text-muted-foreground">
        Il tuo account è sospeso. Contatta NutriLife per riattivarlo.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="outline" className="rounded-full">
          Esci
        </Button>
      </form>
    </main>
  );
}
