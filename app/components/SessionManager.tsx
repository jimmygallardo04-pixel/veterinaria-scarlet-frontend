"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSessionInactivity, DEFAULT_INACTIVITY_CONFIG } from "@/lib/hooks/useSessionInactivity";
import SessionInactivityWarning from "./SessionInactivityWarning";
import useBackToDashboard from "@/app/hooks/useBackToDashboard";
import { clearSession } from "@/lib/session";

interface SessionManagerProps {
  children: React.ReactNode;
  /** Configuración opcional de inactividad */
  inactivityConfig?: {
    inactivityTimeoutMs?: number;
    warningTimeMs?: number;
  };
  /** Si el manager está activo (ej: solo en rutas protegidas) */
  enabled?: boolean;
}

/**
 * Componente que gestiona el cierre automático de sesión por inactividad.
 * Se encarga de:
 * - Detectar inactividad del usuario
 * - Mostrar advertencia antes del cierre
 * - Permitir extender sesión
 * - Cerrar sesión y limpiar tokens
 * - Sincronizar entre múltiples pestañas
 */
export default function SessionManager({
  children,
  inactivityConfig,
  enabled = true,
}: SessionManagerProps) {
  const router = useRouter();

  // Construir configuración
  const config = {
    ...DEFAULT_INACTIVITY_CONFIG,
    ...inactivityConfig,
  };

  // Hook para redirigir al dashboard cuando se presiona back
  useBackToDashboard();

  // Hook para cerrar sesión cuando se recarga la página (F5, Ctrl+R, cierre de navegador, etc)
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("Recarga detectada - limpiando sesión");
      
      // Limpiar caches locales (síncrono)
      if (typeof window !== "undefined") {
        // Usar localStorage (persiste a través de recarga) en lugar de sessionStorage
        localStorage.setItem("logout_in_progress", "true");
        sessionStorage.removeItem("user_me");
        localStorage.removeItem("session_inactivity");
      }
      
      // Intentar limpiar en backend
      clearSession();
    };

    // Escuchar recarga/cierre (F5, Ctrl+R, cerrar navegador, etc)
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Función para cerrar sesión
  const handleLogout = useCallback(() => {
    // Limpiar sesión (cookies y storage)
    clearSession();

    // Mostrar notificación
    toast.info("Sesión cerrada por inactividad", {
      description: "Tu sesión ha expirado debido a inactividad. Por seguridad, debes volver a iniciar sesión.",
      duration: 5000,
    });

    // Redirigir al login
    router.replace("/login?reason=inactivity");
  }, [router]);

  // Función para extender sesión (refresh token)
  const handleExtendSession = useCallback(async () => {
    try {
      // Llamar al endpoint de refresh
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        // Si falla el refresh, forzar logout
        toast.error("No se pudo extender la sesión", {
          description: "Por seguridad, se cerrará tu sesión.",
        });
        handleLogout();
        return;
      }

      toast.success("Sesión extendida", {
        description: "Tu sesión ha sido renovada exitosamente.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error extending session:", error);
      toast.error("Error de conexión", {
        description: "No se pudo extender la sesión. Inténtalo de nuevo.",
      });
    }
  }, [handleLogout]);

  // Hook de inactividad
  const {
    isWarningShown,
    countdownMs,
    extendSession,
    hideWarning,
  } = useSessionInactivity({
    config,
    enabled,
    onLogout: handleLogout,
    onWarning: () => {
      // Opcional: sonido de advertencia
      // playWarningSound();
    },
    extendSession: handleExtendSession,
  });

  // Manejar extensión desde el modal
  const handleExtend = useCallback(async () => {
    await extendSession();
    hideWarning();
  }, [extendSession, hideWarning]);

  // Manejar logout desde el modal
  const handleManualLogout = useCallback(() => {
    hideWarning();
    handleLogout();
  }, [hideWarning, handleLogout]);

  return (
    <>
      {children}
      <SessionInactivityWarning
        open={isWarningShown}
        onExtend={handleExtend}
        onLogout={handleManualLogout}
        countdownInMs={countdownMs}
        warningTimeMs={config.warningTimeMs}
      />
    </>
  );
}