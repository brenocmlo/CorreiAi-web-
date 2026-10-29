import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { AssistantProvider } from "@/contexts/AssistantContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CorreAi — Corretagem Inteligente",
  description: "CRM imobiliário com IA para corretores organizarem leads, funil de vendas e fecharem mais negócios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <AuthProvider>
          <AssistantProvider>
            <Sidebar />
            {children}
          </AssistantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

