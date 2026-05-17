"use client";

import { formatFechaHora } from "@/lib/utils";

type Vacuna = {
  id: number;
  paciente: number;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis?: string;
  observaciones?: string;
};

type Props = {
  vacuna: Vacuna | null;
  open: boolean;
  onClose: () => void;
};

export default function VacunaDetailModal({ vacuna, open, onClose }: Props) {
  if (!open || !vacuna) return null;

  const hoy = new Date().toISOString().split("T")[0];
  const proximaVencida =
    vacuna.proxima_dosis && vacuna.proxima_dosis < hoy;
  const proximaPasada = vacuna.proxima_dosis && vacuna.proxima_dosis <= hoy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="subtitle mb-1">💉 {vacuna.nombre_vacuna}</h2>
            <p className="text-xs text-muted">ID: {vacuna.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-muted hover:text-slate-900"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-xs font-semibold text-muted uppercase">
              Fecha de aplicación
            </p>
            <p className="text-sm text-slate-900">
              {new Date(vacuna.fecha_aplicacion + "T00:00:00").toLocaleDateString(
                "es-ES",
                { weekday: "long", year: "numeric", month: "long", day: "numeric" }
              )}
            </p>
          </div>

          {vacuna.proxima_dosis && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase">
                Próxima dosis
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-900">
                  {new Date(vacuna.proxima_dosis + "T00:00:00").toLocaleDateString(
                    "es-ES",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
                {proximaPasada && (
                  <span className="badge-danger text-xs">Vencida</span>
                )}
                {!proximaPasada && (
                  <span className="badge-warning text-xs">Pendiente</span>
                )}
              </div>
            </div>
          )}

          {vacuna.observaciones && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase">
                Observaciones
              </p>
              <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                {vacuna.observaciones}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
