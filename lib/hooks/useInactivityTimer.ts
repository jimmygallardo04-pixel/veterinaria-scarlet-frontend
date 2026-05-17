"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseInactivityTimerOptions {
  inactivityTimeoutMs?: number;
  warningTimeMs?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

/**
 * Hook que detecta inactividad del usuario y ejecuta callbacks.
 *
 * Eventos que resetean el contador de inactividad:
 * - Mouse movement
 * - Click
 * - Keyboard input
 * - Touch
 *
 * @param options.inactivityTimeoutMs - Tiempo total antes de logout (default: 15 min)
 * @param options.warningTimeMs - Tiempo de advertencia antes del logout (default: 2 min)
 * @param options.onWarning - Callback cuando falta warningTimeMs para logout
 * @param options.onTimeout - Callback cuando se cumple inactivityTimeoutMs
 * @param options.enabled - Si el hook está activo (default: true)
 */
export function useInactivityTimer({
  inactivityTimeoutMs = 15 * 60 * 1000, // 15 minutos
  warningTimeMs = 2 * 60 * 1000, // 2 minutos
  onWarning,
  onTimeout,
  enabled = true,
}: UseInactivityTimerOptions = {}) {
  const [isWarningShown, setIsWarningShown] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const warningTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const resetInactivityTimer = useCallback(() => {
    // Limpiar timers anteriores
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    // Ocultar advertencia si estaba visible
    setIsWarningShown(false);

    if (!enabled) return;

    // Timer para mostrar advertencia
    warningTimerRef.current = setTimeout(() => {
      setIsWarningShown(true);
      onWarning?.();
    }, inactivityTimeoutMs - warningTimeMs);

    // Timer para logout automático
    inactivityTimerRef.current = setTimeout(() => {
      setIsWarningShown(false);
      onTimeout?.();
    }, inactivityTimeoutMs);
  }, [inactivityTimeoutMs, warningTimeMs, onWarning, onTimeout, enabled]);

  // Extender sesión manualmente
  const extendSession = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Listeners para detectar actividad
  useEffect(() => {
    if (!enabled) return;

    // Inicializar timer asíncronamente para evitar setState en el mismo ciclo
    setTimeout(() => {
      resetInactivityTimer();
    }, 0);

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Agregar listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [enabled, resetInactivityTimer]);

  return {
    isWarningShown,
    extendSession,
  };
}
