import { FoodPhoto, type FotoName } from "@/components/food-art";

// Lo stesso sistema della prima pagina, per l'accesso: scheda con la foto come sfondo
// e sopra, in basso, una scheda di vetro bianco leggera con il modulo (pulsante nero).
export function AuthStage({ photo, children }: { photo: FotoName; children: React.ReactNode }) {
  return (
    <section className="bg-grad-fog relative flex min-h-[33rem] flex-col justify-end overflow-hidden rounded-[32px] p-3">
      <FoodPhoto name={photo} priority className="absolute inset-0 h-full w-full object-cover" />
      <div className="glass relative rounded-[26px] p-4 [&_input]:bg-white/80">
        {children}
      </div>
    </section>
  );
}
