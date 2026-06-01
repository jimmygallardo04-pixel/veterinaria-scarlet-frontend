"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { usePaginatedFetch } from "@/lib/hooks/usePaginatedFetch";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";
import { formatFechaHora } from "@/lib/utils";
import { ESTADO_CITA_BADGE, ESTADO_CITA_LABEL } from "@/lib/constants";
import type { Cita, EstadoCita } from "@/lib/types";
import PageSkeleton from "@/app/components/PageSkeleton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import Pagination from "@/app/components/Pagination";
import MinimizableSection from "@/app/components/MinimizableSection";
import BackButton from "@/app/components/BackButton";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CitasPage() {
  const { items: citas, loading, pagination, setPage, reload } =
    usePaginatedFetch<Cita>("/citas/", "Error cargando citas");

  const { confirmOpen, requestDelete, cancelDelete, confirmDelete } =
    useConfirmDelete(
      (uuid) => `/citas/${uuid}/`,
      reload,
      { success: "Cita eliminada", error: "No se pudo eliminar la cita" }
    );

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // ── Filtrado local ────────────────────────────────────────────────────────

  const citasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return citas.filter((c) => {
      const coincideTexto = `${c.paciente_nombre} ${c.tutor_nombre} ${c.motivo}`
        .toLowerCase()
        .includes(q);
      const coincideEstado = filtroEstado ? c.estado === filtroEstado : true;
      return coincideTexto && coincideEstado;
    });
  }, [citas, busqueda, filtroEstado]);

  const limpiarFiltros = useCallback(() => {
    setBusqueda("");
    setFiltroEstado("");
  }, []);

  // ── Actualizar estado ─────────────────────────────────────────────────────

  const actualizarEstado = useCallback(async (uuid: string, estado: EstadoCita) => {
    try {
      const res = await apiFetch(`/citas/${uuid}/`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) { toast.error("No se pudo actualizar la cita"); return; }
      toast.success("Estado actualizado");
      reload();
    } catch {
      toast.error("Error de conexión");
    }
  }, [reload]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2">
          <BackButton href="/dashboard" label="Volver al dashboard" />
        </div>
        <div className="page-header">
          <div>
            <h1 className="title">Citas</h1>
            <p className="text-muted">Agenda y control de visitas</p>
          </div>
          <div className="flex gap-2">
            <Link href="/citas/calendario" className="btn-secondary">Calendario</Link>
            <Link href="/citas/nueva" className="btn-primary">+ Nueva cita</Link>
          </div>
        </div>

        {/* Filtros */}
        <MinimizableSection id="citas-filtros" title="🔍 Filtrar citas" persistent>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className="input sm:col-span-2"
              placeholder="Buscar por paciente, tutor o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <select
              className="input"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div className="flex items-center justify-between mt-3">
            {!loading && (
              <p className="text-muted">{citasFiltradas.length} de {citas.length} citas</p>
            )}
            {(busqueda || filtroEstado) && (
              <button onClick={limpiarFiltros} className="btn-ghost text-sm">
                Limpiar filtros
              </button>
            )}
          </div>
        </MinimizableSection>

        {/* Lista */}
        {loading ? (
          <PageSkeleton rows={5} />
        ) : citasFiltradas.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted">
              {busqueda || filtroEstado
                ? "No hay citas que coincidan con los filtros."
                : "Aún no hay citas registradas."}
            </p>
          </div>
        ) : (
          <section className="space-y-3">
            {citasFiltradas.map((cita) => (
              <div key={cita.uuid} className="card">
                <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={ESTADO_CITA_BADGE[cita.estado] ?? "badge-slate"}>
                        {ESTADO_CITA_LABEL[cita.estado] ?? cita.estado}
                      </span>
                      <p className="text-muted">{formatFechaHora(cita.fecha_hora)}</p>
                    </div>
                    <Link href={`/pacientes/${cita.paciente_uuid}`} className="font-semibold text-slate-900 hover:underline">
                      {cita.paciente_nombre}
                    </Link>
                    <p className="text-muted">
                      Tutor:{" "}
                      <Link href={`/tutores/${cita.tutor_uuid}`} className="text-green-700 hover:underline">
                        {cita.tutor_nombre}
                      </Link>
                    </p>
                    <p className="text-sm text-slate-700 mt-1">{cita.motivo}</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-nowrap shrink-0">
                    <Link href={`/pacientes/${cita.paciente_uuid}`} className="btn-secondary text-sm">
                      Ver paciente
                    </Link>
                    <Link
                      href={`/fichas/nueva?paciente=${cita.paciente_uuid}&cita=${cita.uuid}`}
                      className="btn-primary text-sm"
                    >
                      Crear ficha
                    </Link>
                    {cita.estado !== "completada" && (
                      <button
                        onClick={() => actualizarEstado(cita.uuid, "completada")}
                        className="btn-secondary text-sm"
                      >
                        Completar
                      </button>
                    )}
                    {cita.estado !== "cancelada" && (
                      <button
                        onClick={() => actualizarEstado(cita.uuid, "cancelada")}
                        className="btn-danger text-sm"
                      >
                        Cancelar
                      </button>
                    )}
                    <button onClick={() => requestDelete(cita.uuid)} className="btn-danger text-sm">
                      Eliminar
                    </button>
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

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar cita"
        message="¿Estás seguro de que quieres eliminar esta cita?"
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </main>
  );
}
