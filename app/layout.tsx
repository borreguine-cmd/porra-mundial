import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Porra Mundial 2026",
  description: "Predicciones del Mundial de Fútbol 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-[#f0f4f0] text-gray-900">{children}</body>
    </html>
  );
}
