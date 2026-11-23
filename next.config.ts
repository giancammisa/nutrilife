import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prova dal telefono sulla stessa rete Wi-Fi (solo in sviluppo).
  allowedDevOrigins: ["192.168.1.10"],
  // Cache Components disattivato: le pagine dipendono da chi è collegato (Supabase).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
