import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prova dal telefono sulla stessa rete Wi-Fi (solo in sviluppo).
  allowedDevOrigins: ["192.168.1.10"],
  // Solo in sviluppo: il telefono non deve tenere copie vecchie di stile e codice.
  async headers() {
    if (process.env.NODE_ENV !== "development") return [];
    return [{ source: "/_next/:path*", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] }];
  },
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
