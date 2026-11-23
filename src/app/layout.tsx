import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Un'unica famiglia: Archivo. Espansa e pesantissima per titoli, numeri, grammi e prezzi;
// larghezza normale per i testi. L'asse "wdth" permette entrambe le voci dallo stesso file.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "NutriLife",
  description:
    "Cucina 3.0: il piano del tuo nutrizionista, cucinato e pesato dalla gastronomia di Altamura.",
  applicationName: "NutriLife",
  // iPhone: apertura a schermo intero quando è aggiunta alla schermata Home
  appleWebApp: { capable: true, title: "NutriLife", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#F4E96B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
