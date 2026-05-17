"use client";

import { useEffect, useRef, useState } from "react";

interface SessionInactivityWarningProps {
  open: boolean;
  onExtend: () => void;
  onLogout: () => void;
  countdownInMs?: number;
  warningTimeMs?: number;
}

/**
 * Modal de advertencia por inactividad de sesión.
 * Muestra un countdown y permite al usuario extender la sesión o cerrar sesión manualmente.
 */
export default function SessionInactivityWarning({
  open,
  onExtend,
  onLogout,
  countdownInMs,
  warningTimeMs = 60 * 1000, // 1 minuto por defecto
}: SessionInactivityWarningProps) {
  const [secondsLeft, setSecondsLeft] = useState(
    countdownInMs ? Math.floor(countdownInMs / 1000) : Math.floor(warningTimeMs / 1000)
  );
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    // Iniciar countdown desde el valor proporcionado o desde warningTimeMs
    const initialSeconds = countdownInMs
      ? Math.floor(countdownInMs / 1000)
      : Math.floor(warningTimeMs / 1000);
    setSecondsLeft(initialSeconds);

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          // Logout automático cuando llega a 0
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [open, countdownInMs, warningTimeMs, onLogout]);

  // Resetear countdown cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setSecondsLeft(Math.floor(warningTimeMs / 1000));
    }
  }, [open, warningTimeMs]);

  if (!open) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactivity-warning-title"
      aria-describedby="inactivity-warning-desc"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header con color de advertencia */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⏱️</span>
            </div>
            <div>
              <h2
                id="inactivity-warning-title"
                className="text-lg font-semibold text-white"
              >
                Sesión por expirar
              </h2>
              <p className="text-sm text-white/80">
                Por inactividad detectada
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6">
          <p
            id="inactivity-warning-desc"
            className="text-sm text-slate-600 mb-4"
          >
            Tu sesión se cerrará automáticamente en:
          </p>

          {/* Countdown grande */}
          <div className="mb-6 p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 text-center">
            <div className="text-5xl font-bold text-yellow-700 font-mono tracking-wider">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <p className="text-xs text-yellow-600 mt-2 font-medium">
              minutos : segundos
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-sm text-slate-600">
              ¿Sigues ahí? Haz clic en <strong>"Continuar sesión"</strong> para mantener tu sesión activa.
            </p>

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-blue-500 text-lg">ℹ️</span>
              <p className="text-xs text-blue-700">
                Si no realizas ninguna acción, tu sesión se cerrará automáticamente por seguridad.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onLogout}
              className="btn-secondary flex-1 order-2 sm:order-1"
              aria-label="Cerrar sesión ahora"
            >
              Cerrar sesión
            </button>
            <button
              onClick={onExtend}
              className="btn-primary flex-1 order-1 sm:order-2"
              aria-label="Continuar sesión activa"
            >
              Continuar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}