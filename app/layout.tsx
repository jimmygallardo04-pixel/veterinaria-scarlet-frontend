import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { APP_NAME } from "@/lib/constants";
import Navbar from "@/app/components/Navbar";
import SessionManager from "@/app/components/SessionManager";
import AuthGuard from "@/app/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Sistema de gestión veterinaria",
};

/**
 * Configuración de inactividad de sesión.
 * Se puede personalizar por ruta si es necesario.
 */
const SESSION_CONFIG = {
  // Tiempo de inactividad antes de cerrar sesión (15 minutos por defecto)
  inactivityTimeoutMs: Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS) || 15 * 60 * 1000,
  // Tiempo de advertencia antes del cierre (1 minuto por defecto)
  warningTimeMs: Number(process.env.NEXT_PUBLIC_SESSION_WARNING_MS) || 60 * 1000,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-100 text-slate-900 flex flex-col">
        <Navbar />
        {/* AuthGuard valida sesión en cliente (protección adicional a middleware) */}
        <AuthGuard>
          {/* SessionManager envuelve el contenido para gestionar inactividad */}
          <SessionManager inactivityConfig={SESSION_CONFIG}>
            {children}
          </SessionManager>
        </AuthGuard>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}