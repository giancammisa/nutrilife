import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

// Urbanist: geometrico; sottile e grande per titoli e numeri, medio per etichette e testi.
const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "NutriLife",
  description:
    "Cucina 3.0: il piano del tuo nutrizionista, cucinato e pesato al grammo da laboratori artigiani vicino a te.",
  applicationName: "NutriLife",
  // iPhone: apertura a schermo intero quando è aggiunta alla schermata Home
  appleWebApp: { capable: true, title: "NutriLife", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#DFE6DA",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${urbanist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
