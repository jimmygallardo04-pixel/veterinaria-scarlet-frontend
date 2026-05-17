"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";
import PageSkeleton from "@/app/components/PageSkeleton";

type Resumen = {
  vacunas_vencidas: number;
  vacunas_proximas: number;
  tratamientos_activos: number;
};

type Vacuna = {
  id: number;
  uuid: string;
  paciente: number;
  paciente_uuid: string;
  paciente_nombre: string;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis: string | null;
  observaciones?: string | null;
};

type Tratamiento = {
  id: number;
  uuid: string;
  paciente: number;
  paciente_uuid: string;
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

function AccionesPaciente({ pacienteUuid }: { pacienteUuid: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Link href={`/vacunas/nueva?paciente=${pacienteUuid}`} className="btn-primary">
        Registrar vacuna
      </Link>
      <Link href={`/fichas/nueva?paciente=${pacienteUuid}`} className="btn-secondary">
        Nueva ficha
      </Link>
      <Link href={`/pacientes/${pacienteUuid}`} className="btn-secondary">
        Ver paciente
      </Link>
    </div>
  );
}

export default function AlertasPage() {
  const [data, setData] = useState<AlertasResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/alertas/");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.detail || "No se pudieron cargar las alertas");
          return;
        }
        setData(await res.json());
      } catch {
        toast.error("Error de conexión");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="page-header">
          <div>
            <BackButton href="/dashboard" label="Volver al dashboard" />
            <h1 className="title mt-2">Alertas clínicas</h1>
            {data && (
              <p className="text-muted">
                Revisión al {data.fecha_revision} · Próximas dosis hasta {data.limite_revision}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <PageSkeleton rows={4} />
        ) : !data ? (
          <div className="card text-center py-12">
            <p className="text-muted">No se pudieron cargar las alertas.</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <section className="grid gap-4 md:grid-cols-3">
              <div className="card border-l-4 border-red-500">
                <p className="text-muted">Vacunas vencidas</p>
                <p className="mt-2 text-3xl font-bold text-red-600">{data.resumen.vacunas_vencidas}</p>
              </div>
              <div className="card border-l-4 border-yellow-500">
                <p className="text-muted">Vacunas próximas</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">{data.resumen.vacunas_proximas}</p>
              </div>
              <div className="card border-l-4 border-green-500">
                <p className="text-muted">Tratamientos activos</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{data.resumen.tratamientos_activos}</p>
              </div>
            </section>

            {/* Vacunas vencidas */}
            <section className="card">
              <h2 className="subtitle mb-4">
                Vacunas vencidas
                {data.vacunas_vencidas.length > 0 && (
                  <span className="ml-2 badge-red">{data.vacunas_vencidas.length}</span>
                )}
              </h2>
              {data.vacunas_vencidas.length === 0 ? (
                <p className="text-muted">No hay vacunas vencidas. ✓</p>
              ) : (
                <div className="space-y-3">
                  {data.vacunas_vencidas.map((v) => (
                    <div key={v.id} className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="font-semibold text-red-800">{v.nombre_vacuna}</p>
                      <p className="text-sm text-red-700">Paciente: {v.paciente_nombre}</p>
                      <p className="text-sm text-red-700">Próxima dosis: {v.proxima_dosis || "-"}</p>
                      {v.observaciones && <p className="text-sm text-red-600 mt-1">{v.observaciones}</p>}
                      <AccionesPaciente pacienteUuid={v.paciente_uuid} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Vacunas próximas */}
            <section className="card">
              <h2 className="subtitle mb-4">
                Vacunas próximas a vencer
                {data.vacunas_proximas.length > 0 && (
                  <span className="ml-2 badge-yellow">{data.vacunas_proximas.length}</span>
                )}
              </h2>
              {data.vacunas_proximas.length === 0 ? (
                <p className="text-muted">No hay vacunas próximas a vencer.</p>
              ) : (
                <div className="space-y-3">
                  {data.vacunas_proximas.map((v) => (
                    <div key={v.id} className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                      <p className="font-semibold text-yellow-800">{v.nombre_vacuna}</p>
                      <p className="text-sm text-yellow-700">Paciente: {v.paciente_nombre}</p>
                      <p className="text-sm text-yellow-700">Próxima dosis: {v.proxima_dosis || "-"}</p>
                      {v.observaciones && <p className="text-sm text-yellow-600 mt-1">{v.observaciones}</p>}
                      <AccionesPaciente pacienteUuid={v.paciente_uuid} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Tratamientos activos */}
            <section className="card">
              <h2 className="subtitle mb-4">
                Tratamientos activos
                {data.tratamientos_activos.length > 0 && (
                  <span className="ml-2 badge-green">{data.tratamientos_activos.length}</span>
                )}
              </h2>
              {data.tratamientos_activos.length === 0 ? (
                <p className="text-muted">No hay tratamientos activos.</p>
              ) : (
                <div className="space-y-3">
                  {data.tratamientos_activos.map((t) => (
                    <div key={t.id} className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <p className="font-semibold text-green-800">{t.medicamento}</p>
                      <p className="text-sm text-green-700">Paciente: {t.paciente_nombre}</p>
                      <p className="text-sm text-green-700">{t.dosis} · {t.frecuencia}</p>
                      <p className="text-sm text-green-700">
                        Desde {t.fecha_inicio} hasta {t.fecha_fin || "indefinido"}
                      </p>
                      {t.indicaciones && <p className="text-sm text-green-600 mt-1">{t.indicaciones}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/fichas/nueva?paciente=${t.paciente_uuid}`} className="btn-primary">
                          Nueva ficha
                        </Link>
                        <Link href={`/pacientes/${t.paciente_uuid}`} className="btn-secondary">
                          Ver paciente
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
