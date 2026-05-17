"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { usePaginatedFetch } from "@/lib/hooks/usePaginatedFetch";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";
import type { Tutor } from "@/lib/types";
import PageSkeleton from "@/app/components/PageSkeleton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import Pagination from "@/app/components/Pagination";
import MinimizableSection from "@/app/components/MinimizableSection";

// ─── Tipos de formulario (locales — no son entidades del dominio) ─────────────

type TutorForm = {
  nombre: string;
  rut: string;
  telefono: string;
  email: string;
  direccion: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const FORM_INICIAL: TutorForm = {
  nombre: "",
  rut: "",
  telefono: "",
  email: "",
  direccion: "",
};

function tutorToForm(tutor: Tutor): TutorForm {
  return {
    nombre: tutor.nombre,
    rut: tutor.rut ?? "",
    telefono: tutor.telefono,
    email: tutor.email ?? "",
    direccion: tutor.direccion ?? "",
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TutoresPage() {
  const { items: tutores, loading, pagination, setPage, reload } =
    usePaginatedFetch<Tutor>("/tutores/", "Error cargando tutores");

  const { confirmOpen, requestDelete, cancelDelete, confirmDelete } =
    useConfirmDelete(
      (id) => `/tutores/${id}/`,
      reload,
      { success: "Tutor eliminado", error: "No se pudo eliminar el tutor" }
    );

  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState<TutorForm>(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TutorForm>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);

  // ── Filtrado local ────────────────────────────────────────────────────────

  const tutoresFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return tutores.filter((t) =>
      `${t.nombre} ${t.rut ?? ""} ${t.telefono} ${t.email ?? ""}`.toLowerCase().includes(q)
    );
  }, [tutores, busqueda]);

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
    setEditandoId(tutor.id);
    setEditForm(tutorToForm(tutor));
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditForm(FORM_INICIAL);
  };

  const guardarEdicion = async (id: number) => {
    if (!editForm.nombre || !editForm.telefono) {
      toast.warning("Nombre y teléfono son obligatorios");
      return;
    }
    try {
      setGuardando(true);
      const res = await apiFetch(`/tutores/${id}/`, {
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
          </div>
          <button onClick={crearTutor} disabled={guardando} className="btn-primary mt-4">
            {guardando ? "Guardando..." : "Guardar tutor"}
          </button>
        </MinimizableSection>

        {/* Buscador */}
        <MinimizableSection id="tutores-buscar" title="🔍 Buscar tutores" persistent>
          <input
            className="input"
            placeholder="Buscar por nombre, RUT, teléfono o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {!loading && (
            <p className="text-muted mt-2">
              {tutoresFiltrados.length} de {tutores.length} tutores
            </p>
          )}
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
              <div key={tutor.id} className="card">
                {editandoId === tutor.id ? (
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
                    </div>
                    <div className="flex flex-col gap-2 mt-4 sm:flex-row">
                      <button onClick={() => guardarEdicion(tutor.id)} disabled={guardando} className="btn-primary">
                        {guardando ? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button onClick={cancelarEdicion} className="btn-secondary">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{tutor.nombre}</h3>
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
                      <button onClick={() => requestDelete(tutor.id)} className="btn-danger text-sm">
                        Eliminar
                      </button>
                    </div>
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
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </main>
  );
}
