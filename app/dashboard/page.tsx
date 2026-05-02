"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Alertas = {
  resumen: {
    vacunas_vencidas: number;
    vacunas_proximas: number;
    tratamientos_activos: number;
  };
};

export default function DashboardPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [alertas, setAlertas] = useState<Alertas | null>(null);

  const getToken = () => sessionStorage.getItem("access");

  const cargarAlertas = async () => {
    try {
      const res = await fetch(`${apiUrl}/alertas/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      setAlertas(data);
    } catch (error) {
      console.log(error);
      toast.error("Error cargando alertas");
    }
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <h1 className="title">Dashboard</h1>
          <p className="text-muted">Gestión clínica veterinaria</p>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="subtitle">Alertas clínicas</h2>

            <Link
              href="/alertas"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Ver detalle
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/alertas"
              className="card border-l-4 border-red-500 hover:bg-red-50"
            >
              <p className="text-sm text-muted">Vacunas vencidas</p>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {alertas?.resumen?.vacunas_vencidas ?? 0}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Requieren atención inmediata
              </p>
            </Link>

            <Link
              href="/alertas"
              className="card border-l-4 border-yellow-500 hover:bg-yellow-50"
            >
              <p className="text-sm text-muted">Próximas vacunas</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {alertas?.resumen?.vacunas_proximas ?? 0}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Vencen dentro de 30 días
              </p>
            </Link>

            <Link
              href="/alertas"
              className="card border-l-4 border-green-500 hover:bg-green-50"
            >
              <p className="text-sm text-muted">Tratamientos activos</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {alertas?.resumen?.tratamientos_activos ?? 0}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Pacientes actualmente en tratamiento
              </p>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="subtitle mb-4">Accesos rápidos</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/pacientes" className="card hover:bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">
                Pacientes
              </h3>
              <p className="mt-1 text-sm text-muted">
                Ver, crear y gestionar pacientes
              </p>
            </Link>

            <Link href="/fichas" className="card hover:bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">
                Fichas clínicas
              </h3>
              <p className="mt-1 text-sm text-muted">
                Historial clínico completo
              </p>
            </Link>

            <Link href="/citas" className="card hover:bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Citas</h3>
              <p className="mt-1 text-sm text-muted">
                Agenda y control de visitas
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}