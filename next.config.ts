import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
