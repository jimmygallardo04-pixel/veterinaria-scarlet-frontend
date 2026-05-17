"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearSession, getCachedUser } from "@/lib/session";
import type { Usuario } from "@/lib/types";

/**
 * Loader que se muestra mientras se verifica la sesión.
 */
function SessionLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Verificando sesión...</p>
      </div>
    </div>
  );
}

/**
 * AuthGuard que valida la sesión en cliente.
 * El middleware.ts maneja la protección server-side.
 *
 * Responsabilidades:
 * - Verifica sesión al montar (usa caché o API)
 * - Redirige si la sesión no es válida
 * - Proporciona feedback visual durante carga
 *
 * Notas:
 * - El middleware ya protege rutas privadas en servidor
 * - Este componente es una capa adicional de seguridad en cliente
 * - No intenta redirigir autenticados a dashboard (middleware lo hace)
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      try {
        // Intentar obtener usuario desde caché primero
        const cachedUser = getCachedUser<Usuario>();
        if (cachedUser) {
          setUser(cachedUser);
          setAuthorized(true);
          setChecking(false);
          return;
        }

        // Verificar sesión con la API
        const res = await apiFetch("/me/");

        if (!res.ok) {
          // Sesión inválida
          clearSession();
          setAuthorized(false);
          setUser(null);
          // El middleware redirigirá al recargar
          setChecking(false);
          return;
        }

        const userData: Usuario = await res.json();
        setUser(userData);
        setAuthorized(true);
      } catch (error) {
        console.error("Error validating session:", error);
        clearSession();
        setAuthorized(false);
        setUser(null);
      } finally {
        setChecking(false);
      }
    };

    validateSession();
  }, []);

  // Mostrar loader mientras se verifica
  if (checking) return <SessionLoader />;

  // Si no está autorizado, no renderizar (el middleware redirigirá)
  if (!authorized) return null;

  return <>{children}</>;
}