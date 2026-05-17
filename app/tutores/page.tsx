"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { usePaginatedFetch } from "@/lib/hooks/usePaginatedFetch";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";
import type { Tutor } from "@/lib/types";
import PageSkeleton from "@/app/components/PageSkeleton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import Pagination from "@/app/components/Pagination";
import MinimizableSection from "@/app/components/MinimizableSection";
import BackButton from "@/app/components/BackButton";

// ─── Tipos de formulario (locales — no son entidades del dominio) ─────────────

type TutorForm = {
  nombre: string;
  rut: string;
  telefono: string;
  email: string;
  direccion: string;
  activo: boolean;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const FORM_INICIAL: TutorForm = {
  nombre: "",
  rut: "",
  telefono: "",
  email: "",
  direccion: "",
  activo: true,
};

function tutorToForm(tutor: Tutor): TutorForm {
  return {
    nombre: tutor.nombre,
    rut: tutor.rut ?? "",
    telefono: tutor.telefono,
    email: tutor.email ?? "",
    direccion: tutor.direccion ?? "",
    activo: tutor.activo,
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TutoresPage() {
  const { items: tutores, loading, pagination, setPage, reload } =
    usePaginatedFetch<Tutor>("/tutores/", "Error cargando tutores");

  const { confirmOpen, requestDelete, cancelDelete, confirmDelete } =
    useConfirmDelete(
      (uuid) => `/tutores/${uuid}/`,
      reload,
      { success: "Tutor eliminado", error: "No se pudo eliminar el tutor" }
    );

  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState<string>("");
  const [form, setForm] = useState<TutorForm>(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TutorForm>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);

  // ── Filtrado local ────────────────────────────────────────────────────────

  const tutoresFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return tutores.filter((t) => {
      const coincideTexto = `${t.nombre} ${t.rut ?? ""} ${t.telefono} ${t.email ?? ""}`.toLowerCase().includes(q);
      const coincideActivo = filtroActivo === "" ? true : filtroActivo === "true" ? t.activo : !t.activo;
      return coincideTexto && coincideActivo;
    });
  }, [tutores, busqueda, filtroActivo]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroActivo("");
  };

  // ── Crear ─────────────────────────────────────────────────────────────────

  const crearTutor = async () => {
    if (!form.nombre || !form.telefono) {
      toast.warning("Nombre y teléfono son obligatorios");
      return;
    }
    try {
      setGuardando(true);
      const res = await apiFetch("/tutores/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!res.ok) { toast.error("Error creando tutor"); return; }
      toast.success("Tutor creado correctamente");
      setForm(FORM_INICIAL);
      reload();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // ── Editar ────────────────────────────────────────────────────────────────

  const iniciarEdicion = (tutor: Tutor) => {
    setEditandoId(tutor.uuid);
    setEditForm(tutorToForm(tutor));
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditForm(FORM_INICIAL);
  };

  const guardarEdicion = async (uuid: string) => {
    if (!editForm.nombre || !editForm.telefono) {
      toast.warning("Nombre y teléfono son obligatorios");
      return;
    }
    try {
      setGuardando(true);
      const res = await apiFetch(`/tutores/${uuid}/`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) { toast.error("Error actualizando tutor"); return; }
      toast.success("Tutor actualizado");
      cancelarEdicion();
      reload();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2">
          <BackButton href="/dashboard" label="Volver al dashboard" />
        </div>
        <div className="page-header">
          <div>
            <h1 className="title">Tutores</h1>
            <p className="text-muted">Propietarios y responsables de los pacientes</p>
          </div>
        </div>

        {/* Formulario crear */}
        <MinimizableSection id="tutores-crear" title="➕ Crear tutor" persistent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <input className="input" placeholder="Nombre *" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <input className="input" placeholder="RUT" value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })} />
            <input className="input" placeholder="Teléfono *" value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <input className="input" placeholder="Email" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input sm:col-span-2" placeholder="Dirección" value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              Tutor activo
            </label>
          </div>
          <button onClick={crearTutor} disabled={guardando} className="btn-primary mt-4">
            {guardando ? "Guardando..." : "Guardar tutor"}
          </button>
        </MinimizableSection>

        {/* Buscador */}
        <MinimizableSection id="tutores-buscar" title="🔍 Buscar tutores" persistent>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input"
              placeholder="Buscar por nombre, RUT, teléfono o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <select className="input" value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted">
              {tutoresFiltrados.length} de {tutores.length} tutores
            </p>
            <button onClick={limpiarFiltros} className="text-sm text-green-700">
              Limpiar filtros
            </button>
          </div>
        </MinimizableSection>

        {/* Lista */}
        {loading ? (
          <PageSkeleton rows={4} />
        ) : tutoresFiltrados.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-muted">
              {busqueda ? "No hay tutores que coincidan." : "Aún no hay tutores registrados."}
            </p>
          </div>
        ) : (
          <section className="space-y-3">
            {tutoresFiltrados.map((tutor) => (
              <div key={tutor.uuid} className="card">
                {editandoId === tutor.uuid ? (
                  <div>
                    <h3 className="subtitle mb-4">Editar tutor</h3>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      <input className="input" placeholder="Nombre *" value={editForm.nombre}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} />
                      <input className="input" placeholder="RUT" value={editForm.rut}
                        onChange={(e) => setEditForm({ ...editForm, rut: e.target.value })} />
                      <input className="input" placeholder="Teléfono *" value={editForm.telefono}
                        onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} />
                      <input className="input" placeholder="Email" type="email" value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                      <input className="input sm:col-span-2" placeholder="Dirección" value={editForm.direccion}
                        onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })} />
                      <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={editForm.activo}
                          onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
                        />
                        Tutor activo
                      </label>
                    </div>
                    <div className="flex flex-col gap-2 mt-4 sm:flex-row">
                      <button onClick={() => guardarEdicion(tutor.uuid)} disabled={guardando} className="btn-primary">
                        {guardando ? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button onClick={cancelarEdicion} className="btn-secondary">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Header del tutor */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/tutores/${tutor.uuid}`}
                            className="font-semibold text-slate-900 hover:underline truncate"
                          >
                            {tutor.nombre}
                          </Link>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${tutor.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {tutor.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-muted text-sm overflow-x-auto whitespace-nowrap">
                          {tutor.telefono}
                          {tutor.rut ? ` · ${tutor.rut}` : ""}
                          {tutor.email ? ` · ${tutor.email}` : ""}
                        </p>
                        {tutor.direccion && <p className="text-muted text-sm mt-1 truncate">{tutor.direccion}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => iniciarEdicion(tutor)} className="btn-secondary text-sm">
                          Editar
                        </button>
                        <button onClick={() => requestDelete(tutor.uuid)} className="btn-danger text-sm">
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Pacientes asociados */}
                    {tutor.pacientes_info && tutor.pacientes_info.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span className="text-sm font-medium text-slate-700">
                            Pacientes ({tutor.pacientes_info.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tutor.pacientes_info.map((paciente) => (
                            <Link
                              key={paciente.uuid}
                              href={`/pacientes/${paciente.uuid}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-700 transition-colors"
                            >
                              <span>{paciente.nombre}</span>
                              {paciente.especie_nombre && (
                                <span className="text-xs text-slate-500">
                                  ({paciente.especie_nombre})
                                </span>
                              )}
                              <svg className="w-3.5 h-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14"/>
                                <path d="m12 5 7 7-7 7"/>
                              </svg>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mensaje cuando no hay pacientes */}
                    {(!tutor.pacientes_info || tutor.pacientes_info.length === 0) && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-sm text-muted flex items-center gap-2">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          Sin pacientes asociados
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
        title="Eliminar tutor"
        message="¿Estás seguro? Esta acción eliminará al tutor del sistema."
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </main>
  );
}
