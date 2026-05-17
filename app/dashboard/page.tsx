export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiFetch, type PaginatedResponse } from "@/lib/api";
import { formatFechaHora } from "@/lib/utils";
import type { Cita, Resumen, Paciente } from "@/lib/types";
import DashboardCharts from "./components/DashboardCharts";

const ACCESOS = [
  { href: "/pacientes",     icon: "🐾", label: "Pacientes",      desc: "Ver, crear y gestionar pacientes" },
  { href: "/fichas",        icon: "📋", label: "Fichas clínicas", desc: "Historial clínico completo" },
  { href: "/citas",         icon: "📅", label: "Citas",           desc: "Agenda y control de visitas" },
  { href: "/tutores",       icon: "👤", label: "Tutores",         desc: "Propietarios de los pacientes" },
  { href: "/alertas",       icon: "🔔", label: "Alertas",         desc: "Vacunas y tratamientos pendientes" },
  { href: "/configuracion", icon: "⚙️", label: "Configuración",   desc: "Especies, sexos y tipos de documento" },
] as const;

/**
 * Formatea la fecha actual en español.
 * Función (no constante de módulo) para que siempre devuelva la fecha
 * correcta, incluso si la app lleva abierta varios días.
 */
function formatearHoy(): string {
  return new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

type StatColor = "red" | "yellow" | "green" | "blue";

const STAT_COLORS: Record<StatColor, { border: string; text: string; hover: string }> = {
  red:    { border: "border-red-500",    text: "text-red-600",    hover: "hover:bg-red-50" },
  yellow: { border: "border-yellow-500", text: "text-yellow-600", hover: "hover:bg-yellow-50" },
  green:  { border: "border-green-500",  text: "text-green-600",  hover: "hover:bg-green-50" },
  blue:   { border: "border-blue-500",   text: "text-blue-600",   hover: "hover:bg-blue-50" },
};

function StatCard({
  label, value, color, href, sub,
}: {
  label: string; value: number; color: StatColor; href: string; sub: string;
}) {
  const { border, text, hover } = STAT_COLORS[color];
  return (
    <Link href={href} className={`card border-l-4 ${border} ${hover} transition-colors`}>
      <p className="text-muted">{label}</p>
      <p className={`mt-2 text-4xl font-bold ${text}`}>{value}</p>
      <p className="mt-1 text-muted">{sub}</p>
    </Link>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default async function DashboardPage() {
  let resumen: Resumen | null = null;
  let citasPendientes: Cita[] = [];
  
  // Datos para gráficos
  let dataCitasGrafico: { fecha: string; citas: number }[] = [];
  let dataEspeciesGrafico: { name: string; value: number }[] = [];

  try {
    const [resAlertas, resCitas, resPacientes] = await Promise.all([
      apiFetch("/alertas/"),
      apiFetch("/citas/?page_size=500"),
      apiFetch("/pacientes/?page_size=500"),
    ]);

    if (resAlertas.ok) {
      const data = await resAlertas.json();
      resumen = data.resumen;
    }

    if (resCitas.ok) {
      const data: PaginatedResponse<Cita> = await resCitas.json();
      
      // Extraer próximas 5 citas pendientes
      citasPendientes = data.results
        .filter((c) => c.estado === "pendiente")
        .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
        .slice(0, 5);
        
      // Extraer datos para el gráfico de citas (últimos 30 días)
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      
      const conteoCitas: Record<string, number> = {};
      data.results.forEach((c) => {
        const fecha = new Date(c.fecha_hora);
        if (fecha >= hace30Dias) {
          // Formato "DD/MM"
          const key = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
          conteoCitas[key] = (conteoCitas[key] || 0) + 1;
        }
      });
      
      // Convertir a array y ordenar cronológicamente
      dataCitasGrafico = Object.entries(conteoCitas)
        .map(([fecha, citas]) => ({ fecha, citas }))
        .sort((a, b) => {
          const [dayA, monthA] = a.fecha.split("/");
          const [dayB, monthB] = b.fecha.split("/");
          return new Date(2025, parseInt(monthA)-1, parseInt(dayA)).getTime() - new Date(2025, parseInt(monthB)-1, parseInt(dayB)).getTime();
        });
    }

    if (resPacientes.ok) {
      const data: PaginatedResponse<Paciente> = await resPacientes.json();
      const conteoEspecies: Record<string, number> = {};
      
      data.results.forEach((p) => {
        const esp = p.especie_nombre || "Desconocido";
        conteoEspecies[esp] = (conteoEspecies[esp] || 0) + 1;
      });
      
      dataEspeciesGrafico = Object.entries(conteoEspecies)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Mayor a menor
    }
  } catch (err) {
    console.error("Error cargando dashboard SSR:", err);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">

        <section>
          <h1 className="title">Dashboard</h1>
          <p className="text-muted capitalize">{formatearHoy()}</p>
        </section>

        {/* Alertas clínicas */}
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="subtitle">Alertas clínicas</h2>
            <Link href="/alertas" className="btn-secondary text-sm">Ver detalle</Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Vacunas vencidas"    value={resumen?.vacunas_vencidas ?? 0}    color="red"    href="/alertas" sub="Requieren atención inmediata" />
            <StatCard label="Próximas vacunas"    value={resumen?.vacunas_proximas ?? 0}    color="yellow" href="/alertas" sub="Vencen dentro de 30 días" />
            <StatCard label="Tratamientos activos" value={resumen?.tratamientos_activos ?? 0} color="green"  href="/alertas" sub="Pacientes en tratamiento" />
          </div>
        </section>

        {/* Módulo de Analíticas */}
        <section>
          <DashboardCharts dataCitas={dataCitasGrafico} dataEspecies={dataEspeciesGrafico} />
        </section>

        {/* Próximas citas */}
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="subtitle">Próximas citas pendientes</h2>
            <Link href="/citas" className="btn-secondary text-sm">Ver todas</Link>
          </div>

          {citasPendientes.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-muted">No hay citas pendientes.</p>
              <Link href="/citas/nueva" className="btn-primary mt-4 inline-flex">Agendar cita</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {citasPendientes.map((cita) => (
                <div key={cita.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3 md:py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{cita.paciente_nombre}</p>
                    <p className="text-muted text-sm">{formatFechaHora(cita.fecha_hora)} · {cita.motivo}</p>
                  </div>
                  <Link href={`/fichas/nueva?paciente=${cita.paciente}&cita=${cita.uuid}`} className="btn-primary shrink-0 text-sm w-full sm:w-auto text-center">
                    Atender
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Accesos rápidos */}
        <section>
          <h2 className="subtitle mb-4">Accesos rápidos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACCESOS.map((a) => (
              <Link key={a.href} href={a.href} className="card hover:shadow-md hover:border-slate-300 transition-all">
                <div className="text-3xl mb-2">{a.icon}</div>
                <h3 className="font-semibold text-slate-900 text-sm md:text-base">{a.label}</h3>
                <p className="text-muted text-xs md:text-sm mt-1">{a.desc}</p>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
