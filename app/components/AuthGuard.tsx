"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearSession, getCachedUser } from "@/lib/session";
import type { Usuario } from "@/lib/types";

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ["/login", "/registro"];

/**
 * Loader que se muestra mientras se verifica la sesión.
 */
function SessionLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
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
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);

  // Si es ruta pública, no validar, solo renderizar
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
  
  useEffect(() => {
    // En rutas públicas, no validar sesión
    if (isPublicRoute) {
      setChecking(false);
      setAuthorized(true);
      return;
    }

    const validateSession = async () => {
      try {
        // Si hay un logout en progreso, no autorizar - redirección INMEDIATA
        const logoutInProgress = localStorage.getItem("logout_in_progress");
        if (logoutInProgress === "true") {
          localStorage.removeItem("logout_in_progress");
          clearSession();
          setAuthorized(false);
          setUser(null);
          setChecking(false);
          // Redirección inmediata sin esperar render
          if (typeof window !== "undefined") {
            window.location.replace("/login");
          }
          return;
        }

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
          // Sesión inválida - redirección INMEDIATA
          clearSession();
          setAuthorized(false);
          setUser(null);
          setChecking(false);
          // Redirección inmediata sin esperar render
          if (typeof window !== "undefined") {
            window.location.replace("/login");
          }
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
        setChecking(false);
        // Redirección inmediata sin esperar render
        if (typeof window !== "undefined") {
          window.location.replace("/login");
        }
      } finally {
        setChecking(false);
      }
    };

    validateSession();
  }, [pathname, isPublicRoute]);

  // Mostrar loader mientras se verifica
  if (checking) return <SessionLoader />;

  // Si no está autorizado, mostrar loader mientras se redirecciona
  if (!authorized) return <SessionLoader />;

  return <>{children}</>;
}