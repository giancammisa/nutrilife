import type { MetadataRoute } from "next";

// Descrive l'app al telefono: nome, icona, colori, apertura a schermo intero.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NutriLife",
    short_name: "NutriLife",
    description: "Cucina 3.0: il piano del tuo nutrizionista, cucinato e pesato al grammo da cucine vicino a te.",
    lang: "it",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#DFE6DA",
    theme_color: "#DFE6DA",
    categories: ["food", "health", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
