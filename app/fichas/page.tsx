"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePaginatedFetch } from "@/lib/hooks/usePaginatedFetch";
import { formatFechaHora } from "@/lib/utils";
import type { FichaClinica } from "@/lib/types";
import PageSkeleton from "@/app/components/PageSkeleton";
import Pagination from "@/app/components/Pagination";
import MinimizableSection from "@/app/components/MinimizableSection";
import BackButton from "@/app/components/BackButton";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function FichasPage() {
  const { items: fichas, loading, pagination, setPage } =
    usePaginatedFetch<FichaClinica>("/fichas/", "Error cargando fichas clínicas");

  const [busqueda, setBusqueda] = useState("");

  const fichasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return fichas.filter((f) =>
      `${f.paciente_nombre} ${f.motivo_consulta} ${f.diagnostico ?? ""} ${f.tratamiento ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [fichas, busqueda]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2">
          <BackButton href="/dashboard" label="Volver al dashboard" />
        </div>
        <div className="page-header">
          <div>
            <h1 className="title">Fichas clínicas</h1>
            <p className="text-muted">Historial de atenciones médicas</p>
          </div>
          <Link href="/fichas/nueva" className="btn-primary">
            + Nueva ficha
          </Link>
        </div>

        {/* Buscador */}
        <MinimizableSection id="fichas-buscar" title="🔍 Buscar fichas" persistent>
          <div className="flex items-center gap-3">
            <svg className="text-slate-400 shrink-0" xmlns="http://www.w3.org/2000/svg"
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="input"
              placeholder="Buscar por paciente, motivo, diagnóstico..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} className="btn-ghost shrink-0 text-sm">
                Limpiar
              </button>
            )}
          </div>
          {!loading && (
            <p className="text-muted mt-3">
              {fichasFiltradas.length} de {fichas.length} fichas
            </p>
          )}
        </MinimizableSection>

        {/* Lista */}
        {loading ? (
          <PageSkeleton rows={5} />
        ) : fichasFiltradas.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-400 text-lg mb-1">Sin resultados</p>
            <p className="text-muted">
              {busqueda
                ? "No hay fichas que coincidan con la búsqueda."
                : "Aún no hay fichas clínicas registradas."}
            </p>
            {busqueda && (
              <button onClick={() => setBusqueda("")} className="btn-secondary mt-4">
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <section className="space-y-3">
            {fichasFiltradas.map((ficha) => (
              <div key={ficha.uuid} className="card">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-muted">{formatFechaHora(ficha.fecha)}</p>
                    <Link href={`/pacientes/${ficha.paciente_uuid}`} className="font-semibold text-slate-900 mt-0.5 hover:underline">
                      {ficha.paciente_nombre}
                    </Link>
                    <p className="text-sm text-slate-700 mt-1">{ficha.motivo_consulta}</p>
                    {ficha.diagnostico && (
                      <p className="text-muted mt-1">
                        <strong className="text-slate-700">Diagnóstico:</strong>{" "}
                        {ficha.diagnostico}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row shrink-0">
                    <Link href={`/fichas/${ficha.uuid}`} className="btn-primary text-center text-sm">
                      Ver ficha
                    </Link>
                    <Link href={`/pacientes/${ficha.paciente_uuid}`} className="btn-secondary text-center text-sm">
                      Ver paciente
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        <Pagination
          count={pagination.totalCount}
          next={pagination.next}
          previous={pagination.previous}
          currentPage={pagination.currentPage}
          onPageChange={setPage}
        />
      </div>
    </main>
  );
}
