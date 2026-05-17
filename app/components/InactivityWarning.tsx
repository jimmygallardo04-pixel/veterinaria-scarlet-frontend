"use client";

import { useEffect, useRef, useState } from "react";

interface InactivityWarningProps {
  open: boolean;
  onExtend: () => void;
  onLogout: () => void;
  warningTimeMs?: number;
  countdownInMs?: number;
}

/**
 * Modal que avisa al usuario sobre inactividad y cuenta regresiva antes del logout.
 */
export default function InactivityWarning({
  open,
  onExtend,
  onLogout,
  warningTimeMs = 2 * 60 * 1000, // 2 minutos
  countdownInMs,
}: InactivityWarningProps) {
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(warningTimeMs / 1000));
  const countdownRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    // Iniciar countdown
    setSecondsLeft(Math.floor(warningTimeMs / 1000));

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          // Logout automático cuando llega a 0
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [open, warningTimeMs, onLogout]);

  if (!open) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">⏱️</span>
          </div>
          <div>
            <h2 id="inactivity-title" className="text-lg font-semibold text-slate-900">
              Sesión expirando
            </h2>
            <p className="text-sm text-slate-500">Por inactividad</p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-slate-700 mb-2">
            Tu sesión se cerrará automáticamente en:
          </p>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600 font-mono">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <p className="text-xs text-slate-500 mt-2">minutos:segundos</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Haz clic en "Continuar trabajando" para mantener tu sesión activa.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="btn-secondary flex-1"
          >
            Cerrar sesión
          </button>
          <button
            onClick={onExtend}
            className="btn-primary flex-1"
          >
            Continuar trabajando
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Si no hay actividad, tu sesión se cerrará automáticamente.
        </p>
      </div>
    </div>
  );
}
