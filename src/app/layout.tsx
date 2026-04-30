import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Condomínio 1154",
  description: "Sistema de Gestão do Condomínio 1154",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
