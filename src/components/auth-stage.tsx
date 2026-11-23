import { FoodPhoto, type FotoName } from "@/components/food-art";

// Lo stesso sistema della prima pagina, per l'accesso: scheda con la foto come sfondo
// e sopra una scheda nera di vetro con il modulo. Dentro la scheda nera i colori si
// invertono (classe "on-ink"): testo chiaro, campi trasparenti, pulsante lime.
export function AuthStage({ photo, children }: { photo: FotoName; children: React.ReactNode }) {
  return (
    <section className="bg-grad-fog relative flex min-h-[31rem] flex-col justify-end overflow-hidden rounded-[32px] p-3">
      <FoodPhoto name={photo} priority className="absolute inset-0 h-full w-full object-cover" />
      <div className="on-ink relative rounded-[26px] border border-white/15 bg-ink/75 p-5 backdrop-blur-2xl">
        {children}
      </div>
    </section>
  );
}
