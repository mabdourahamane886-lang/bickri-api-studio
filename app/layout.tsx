import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BICKRI API STUDIO",
  description: "Console de gestion et de préparation des API IA de Bickri Service Agency.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}