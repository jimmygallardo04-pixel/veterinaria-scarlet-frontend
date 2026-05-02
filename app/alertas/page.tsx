"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Resumen = {
  vacunas_vencidas: number;
  vacunas_proximas: number;
  tratamientos_activos: number;
};

type Vacuna = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis: string | null;
  observaciones?: string | null;
};

type Tratamiento = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  indicaciones?: string | null;
};

type AlertasResponse = {
  fecha_revision: string;
  limite_revision: string;
  resumen: Resumen;
  vacunas_vencidas: Vacuna[];
  vacunas_proximas: Vacuna[];
  tratamientos_activos: Tratamiento[];
};

export default function AlertasPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [data, setData] = useState<AlertasResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => sessionStorage.getItem("access");

  const cargarAlertas = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${apiUrl}/alertas/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        toast.error("No se pudieron cargar las alertas");
        return;
      }

      const json = await res.json();
      setData(json);
    } catch (error) {
      console.log(error);
      toast.error("Error cargando alertas clínicas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="card mx-auto max-w-5xl">
          <p className="text-muted">Cargando alertas clínicas...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="card mx-auto max-w-5xl">
          <p className="text-muted">No se pudieron cargar las alertas.</p>
        </div>
      </main>
    );
  }

  const BotonesAccionPaciente = ({
    pacienteId,
    variant = "default",
  }: {
    pacienteId: number;
    variant?: "danger" | "warning" | "success" | "default";
  }) => {
    const color =
      variant === "danger"
        ? "bg-red-600 hover:bg-red-700"
        : variant === "warning"
        ? "bg-yellow-500 hover:bg-yellow-600"
        : variant === "success"
        ? "bg-green-600 hover:bg-green-700"
        : "bg-slate-700 hover:bg-slate-800";

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/vacunas/nueva?paciente=${pacienteId}`}
          className={`${color} rounded-lg px-3 py-2 text-sm font-medium text-white`}
        >
          Registrar vacuna
        </Link>

        <Link
          href={`/fichas/nueva?paciente=${pacienteId}`}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Nueva ficha
        </Link>

        <Link
          href={`/citas?paciente=${pacienteId}`}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Agendar cita
        </Link>

        <Link
          href={`/pacientes/${pacienteId}`}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver paciente
        </Link>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="title">Alertas clínicas</h1>
            <p className="text-muted">
              Revisión al {data.fecha_revision}. Próximas dosis hasta{" "}
              {data.limite_revision}.
            </p>
          </div>

          <Link href="/dashboard" className="rounded-lg border px-4 py-2">
            Volver al dashboard
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="card border-l-4 border-red-500">
            <p className="text-sm text-muted">Vacunas vencidas</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {data.resumen.vacunas_vencidas}
            </p>
          </div>

          <div className="card border-l-4 border-yellow-500">
            <p className="text-sm text-muted">Vacunas próximas</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {data.resumen.vacunas_proximas}
            </p>
          </div>

          <div className="card border-l-4 border-green-500">
            <p className="text-sm text-muted">Tratamientos activos</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {data.resumen.tratamientos_activos}
            </p>
          </div>
        </section>

        <section className="card">
          <h2 className="subtitle mb-4">Vacunas vencidas</h2>

          {data.vacunas_vencidas.length === 0 ? (
            <p className="text-muted">No hay vacunas vencidas.</p>
          ) : (
            <div className="space-y-3">
              {data.vacunas_vencidas.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-red-200 bg-red-50 p-4"
                >
                  <div>
                    <p className="font-semibold text-red-800">
                      {v.nombre_vacuna}
                    </p>
                    <p className="text-sm text-red-700">
                      Paciente: {v.paciente_nombre}
                    </p>
                    <p className="text-sm text-red-700">
                      Próxima dosis: {v.proxima_dosis || "-"}
                    </p>
                    {v.observaciones && (
                      <p className="mt-1 text-sm text-red-700">
                        Observaciones: {v.observaciones}
                      </p>
                    )}
                  </div>

                  <BotonesAccionPaciente
                    pacienteId={v.paciente}
                    variant="danger"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="subtitle mb-4">Vacunas próximas a vencer</h2>

          {data.vacunas_proximas.length === 0 ? (
            <p className="text-muted">No hay vacunas próximas.</p>
          ) : (
            <div className="space-y-3">
              {data.vacunas_proximas.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
                >
                  <div>
                    <p className="font-semibold text-yellow-800">
                      {v.nombre_vacuna}
                    </p>
                    <p className="text-sm text-yellow-700">
                      Paciente: {v.paciente_nombre}
                    </p>
                    <p className="text-sm text-yellow-700">
                      Próxima dosis: {v.proxima_dosis || "-"}
                    </p>
                    {v.observaciones && (
                      <p className="mt-1 text-sm text-yellow-700">
                        Observaciones: {v.observaciones}
                      </p>
                    )}
                  </div>

                  <BotonesAccionPaciente
                    pacienteId={v.paciente}
                    variant="warning"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="subtitle mb-4">Tratamientos activos</h2>

          {data.tratamientos_activos.length === 0 ? (
            <p className="text-muted">No hay tratamientos activos.</p>
          ) : (
            <div className="space-y-3">
              {data.tratamientos_activos.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-green-200 bg-green-50 p-4"
                >
                  <div>
                    <p className="font-semibold text-green-800">
                      {t.medicamento}
                    </p>
                    <p className="text-sm text-green-700">
                      Paciente: {t.paciente_nombre}
                    </p>
                    <p className="text-sm text-green-700">
                      {t.dosis} · {t.frecuencia}
                    </p>
                    <p className="text-sm text-green-700">
                      Desde {t.fecha_inicio} hasta{" "}
                      {t.fecha_fin || "indefinido"}
                    </p>
                    {t.indicaciones && (
                      <p className="mt-1 text-sm text-green-700">
                        Indicaciones: {t.indicaciones}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/fichas/nueva?paciente=${t.paciente}`}
                      className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Nueva ficha
                    </Link>

                    <Link
                      href={`/citas?paciente=${t.paciente}`}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Agendar control
                    </Link>

                    <Link
                      href={`/pacientes/${t.paciente}`}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Ver paciente
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}