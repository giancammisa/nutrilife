import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prova dal telefono sulla stessa rete Wi-Fi (solo in sviluppo).
  allowedDevOrigins: ["192.168.1.10"],
  // Solo in sviluppo: indirizzi dei file diversi a ogni avvio, così il telefono non riusa copie vecchie.
  deploymentId: process.env.NODE_ENV === "development" ? `dev-${Date.now()}` : undefined,
  // Solo in sviluppo: il telefono non deve tenere copie vecchie di stile e codice.
  async headers() {
    // Sicurezza di base su tutte le pagine
    const security = {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      ],
    };
    if (process.env.NODE_ENV !== "development") return [security];
    return [
      security,
      { source: "/_next/:path*", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
    ];
  },
  // Piani dieta (PDF/foto) fino a 4 MB nelle azioni del server
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
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
