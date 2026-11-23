import type { MetadataRoute } from "next";

// Descrive l'app al telefono: nome, icona, colori, apertura a schermo intero.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NutriLife",
    short_name: "NutriLife",
    description: "Il piano del tuo nutrizionista, cucinato dalla gastronomia di Altamura. Dimmelo prima.",
    lang: "it",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F6F3",
    theme_color: "#F7F6F3",
    categories: ["food", "health", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
