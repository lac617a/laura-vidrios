import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import "./globals.css";

// Tipografías provisionales (PRD §11): serif para títulos, sans para texto.
// Se cambian aquí y en globals.css cuando exista la identidad visual.
const sans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const heading = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Catálogo de espejos",
  description: "Espejos de todo tipo y a la medida, con envío e instalación en Colombia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${sans.variable} ${heading.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
