"use client";

type Tratamiento = {
  id: number;
  paciente: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin?: string;
  indicaciones?: string;
  observaciones?: string;
};

type Props = {
  tratamiento: Tratamiento | null;
  open: boolean;
  onClose: () => void;
};

export default function TratamientoDetailModal({
  tratamiento,
  open,
  onClose,
}: Props) {
  if (!open || !tratamiento) return null;

  const hoy = new Date().toISOString().split("T")[0];
  const estado =
    tratamiento.fecha_inicio > hoy
      ? "futuro"
      : !tratamiento.fecha_fin || tratamiento.fecha_fin >= hoy
        ? "activo"
        : "finalizado";

  const estadoColor = {
    futuro: "badge-info",
    activo: "badge-success",
    finalizado: "badge-slate",
  };

  const estadoLabel = {
    futuro: "Futuro",
    activo: "Activo",
    finalizado: "Finalizado",
  };

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
            <h2 className="subtitle mb-1">💊 {tratamiento.medicamento}</h2>
            <p className="text-xs text-muted">ID: {tratamiento.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-muted hover:text-slate-900"
          >
            ×
          </button>
        </div>

        <div className="mb-3">
          <span className={estadoColor[estado] ?? "badge-slate"}>
            {estadoLabel[estado] ?? estado}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-muted uppercase">
                Dosis
              </p>
              <p className="text-sm text-slate-900">{tratamiento.dosis}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase">
                Frecuencia
              </p>
              <p className="text-sm text-slate-900">{tratamiento.frecuencia}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-muted uppercase">
                Inicio
              </p>
              <p className="text-sm text-slate-900">
                {new Date(tratamiento.fecha_inicio + "T00:00:00").toLocaleDateString(
                  "es-ES",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
            </div>
            {tratamiento.fecha_fin && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase">
                  Fin
                </p>
                <p className="text-sm text-slate-900">
                  {new Date(tratamiento.fecha_fin + "T00:00:00").toLocaleDateString(
                    "es-ES",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                </p>
              </div>
            )}
          </div>

          {tratamiento.indicaciones && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase">
                Indicaciones
              </p>
              <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                {tratamiento.indicaciones}
              </p>
            </div>
          )}

          {tratamiento.observaciones && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase">
                Observaciones
              </p>
              <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                {tratamiento.observaciones}
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
