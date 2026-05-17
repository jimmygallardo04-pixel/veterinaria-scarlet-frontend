"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Configuración del sistema de inactividad de sesión.
 * Valores por defecto configurables.
 */
export interface SessionInactivityConfig {
  /** Tiempo total de inactividad antes de cerrar sesión (ms). Default: 15 min */
  inactivityTimeoutMs: number;
  /** Tiempo de advertencia antes del cierre (ms). Default: 1 min */
  warningTimeMs: number;
}

/**
 * Configuración por defecto - se puede sobrescribir con variables de entorno
 */
export const DEFAULT_INACTIVITY_CONFIG: SessionInactivityConfig = {
  inactivityTimeoutMs: Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS) || 15 * 60 * 1000, // 15 min
  warningTimeMs: Number(process.env.NEXT_PUBLIC_SESSION_WARNING_MS) || 60 * 1000, // 1 min
};

/**
 * Eventos que resetean el contador de inactividad
 */
const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "mousemove",
  "wheel",
  "touchmove",
  "keypress",
  "keyup",
] as const;

/**
 * Clave para Storage events (sincronización entre pestañas)
 */
const STORAGE_KEY = "session_inactivity";

/**
 * Tipos de mensajes para comunicación entre pestañas
 */
enum StorageMessageType {
  ACTIVITY = "activity",
  LOGOUT = "logout",
  EXTEND = "extend",
}

interface StorageMessage {
  type: StorageMessageType;
  timestamp: number;
  tabId: string;
}

/**
 * Hook que gestiona el cierre automático de sesión por inactividad.
 * Incluye sincronización entre múltiples pestañas.
 *
 * Características:
 * - Detecta actividad del usuario (mouse, teclado, scroll, touch)
 * - Muestra advertencia antes de cerrar sesión
 * - Sincroniza estado entre pestañas abiertas
 * - Permite extender sesión manualmente
 * - Limpia tokens y redirige al login
 *
 * @param config - Configuración de tiempos
 * @param enabled - Si el hook está activo
 * @param onLogout - Callback cuando se cierra sesión
 * @param onWarning - Callback cuando se muestra advertencia
 * @param extendSession - Función para extender sesión (refresh token)
 */
export function useSessionInactivity({
  config = DEFAULT_INACTIVITY_CONFIG,
  enabled = true,
  onLogout,
  onWarning,
  extendSession,
}: {
  config?: SessionInactivityConfig;
  enabled?: boolean;
  onLogout?: () => void;
  onWarning?: () => void;
  extendSession?: () => Promise<void>;
}) {
  const { inactivityTimeoutMs, warningTimeMs } = config;

  const [isWarningShown, setIsWarningShown] = useState(false);
  const [countdown, setCountdown] = useState(warningTimeMs);
  const [isActive, setIsActive] = useState(enabled);

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabIdRef = useRef<string>(`tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Referencia para tracking de última actividad
  const lastActivityRef = useRef<number>(Date.now());

  /**
   * Notifica a otras pestañas sobre una acción
   */
  const broadcastMessage = useCallback((type: StorageMessageType) => {
    if (typeof window === "undefined") return;

    const message: StorageMessage = {
      type,
      timestamp: Date.now(),
      tabId: tabIdRef.current,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
    } catch (e) {
      console.warn("No se pudo broadcastear mensaje:", e);
    }
  }, []);

  /**
   * Limpia todos los timers
   */
  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  /**
   * Ejecuta el logout (propio y notifica a otras pestañas)
   */
  const handleLogout = useCallback(() => {
    clearAllTimers();
    setIsWarningShown(false);
    setIsActive(false);
    broadcastMessage(StorageMessageType.LOGOUT);
    onLogout?.();
  }, [clearAllTimers, broadcastMessage, onLogout]);

  /**
   * Muestra la advertencia
   */
  const showWarning = useCallback(() => {
    setIsWarningShown(true);
    setCountdown(warningTimeMs);
    onWarning?.();

    // Iniciar countdown visual
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [warningTimeMs, onWarning]);

  /**
   * Resetea el timer de inactividad
   */
  const resetInactivityTimer = useCallback(() => {
    if (!isActive) return;

    lastActivityRef.current = Date.now();
    clearAllTimers();
    setIsWarningShown(false);
    setCountdown(warningTimeMs);

    // Programar advertencia
    warningTimerRef.current = setTimeout(() => {
      showWarning();
    }, inactivityTimeoutMs - warningTimeMs);

    // Programar logout
    inactivityTimerRef.current = setTimeout(() => {
      handleLogout();
    }, inactivityTimeoutMs);

    // Notificar actividad a otras pestañas
    broadcastMessage(StorageMessageType.ACTIVITY);
  }, [
    isActive,
    inactivityTimeoutMs,
    warningTimeMs,
    clearAllTimers,
    showWarning,
    handleLogout,
    broadcastMessage,
  ]);

  /**
   * Extiende la sesión (llama al callback y resetea timers)
   */
  const handleExtendSession = useCallback(async () => {
    // Intentar extender sesión en el backend si hay callback
    if (extendSession) {
      try {
        await extendSession();
      } catch (e) {
        console.error("Error extendiendo sesión:", e);
      }
    }

    // Resetear timers locales
    resetInactivityTimer();

    // Notificar a otras pestañas
    broadcastMessage(StorageMessageType.EXTEND);
  }, [extendSession, resetInactivityTimer, broadcastMessage]);

  // Manejador de eventos de actividad
  const handleActivity = useCallback(() => {
    if (!isActive || isWarningShown) return;
    resetInactivityTimer();
  }, [isActive, isWarningShown, resetInactivityTimer]);

  // Manejador de mensajes de otras pestañas
  useEffect(() => {
    if (!enabled) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;

      try {
        const message: StorageMessage = JSON.parse(event.newValue);

        // Ignorar mensajes de nuestra propia pestaña
        if (message.tabId === tabIdRef.current) return;

        switch (message.type) {
          case StorageMessageType.LOGOUT:
            // Otra pestaña cerró sesión - cerrar en todas
            handleLogout();
            break;

          case StorageMessageType.ACTIVITY:
            // Otra pestaña tuvo actividad - resetear timers
            if (isActive && !isWarningShown) {
              resetInactivityTimer();
            }
            break;

          case StorageMessageType.EXTEND:
            // Otra pestaña extendió sesión - resetear timers
            if (isActive) {
              resetInactivityTimer();
            }
            break;
        }
      } catch (e) {
        console.warn("Error procesando mensaje de storage:", e);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [enabled, isActive, isWarningShown, handleLogout, resetInactivityTimer]);

  // Configurar listeners de actividad
  useEffect(() => {
    if (!enabled || !isActive) return;

    // Inicializar timer
    resetInactivityTimer();

    // Agregar listeners
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true, capture: true });
    });

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity, { capture: true });
      });
      clearAllTimers();
    };
  }, [enabled, isActive, resetInactivityTimer, handleActivity, clearAllTimers]);

  // Actualizar estado cuando cambia enabled
  useEffect(() => {
    setIsActive(enabled);
    if (!enabled) {
      clearAllTimers();
      setIsWarningShown(false);
    }
  }, [enabled, clearAllTimers]);

  return {
    isWarningShown,
    countdownMs: countdown,
    extendSession: handleExtendSession,
    hideWarning: useCallback(() => {
      setIsWarningShown(false);
      setCountdown(warningTimeMs);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }, [warningTimeMs]),
  };
}