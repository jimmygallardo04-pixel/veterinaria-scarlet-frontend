"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch, type PaginatedResponse } from "@/lib/api";
import { usePaginatedFetch } from "@/lib/hooks/usePaginatedFetch";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";
import { API_ROUTES, DROPDOWN_PAGE_SIZE } from "@/lib/constants";
import type { Paciente, Opcion } from "@/lib/types";
import PageSkeleton from "@/app/components/PageSkeleton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import Pagination from "@/app/components/Pagination";
import MinimizableSection from "@/app/components/MinimizableSection";
import { formatEdad } from "@/lib/utils";

// ─── Tipos de formulario (locales — no son entidades del dominio) ─────────────

type PacienteForm = {
  nombre: string;
  especie: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string;
  color: string;
  esterilizado: boolean;
  observaciones: string;
  tutor: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const FORM_INICIAL: PacienteForm = {
  nombre: "",
  especie: "",
  raza: "",
  sexo: "",
  fecha_nacimiento: "",
  color: "",
  esterilizado: false,
  observaciones: "",
  tutor: "",
};

function pacienteToForm(p: Paciente): PacienteForm {
  return {
    nombre: p.nombre,
    especie: String(p.especie),
    raza: p.raza ?? "",
    sexo: p.sexo ? String(p.sexo) : "",
    fecha_nacimiento: p.fecha_nacimiento ?? "",
    color: p.color ?? "",
    esterilizado: p.esterilizado,
    observaciones: p.observaciones ?? "",
    tutor: String(p.tutor),
  };
}

function formToPayload(form: PacienteForm) {
  return {
    nombre: form.nombre,
    especie: Number(form.especie),
    raza: form.raza || null,
    sexo: Number(form.sexo),
    fecha_nacimiento: form.fecha_nacimiento || null,
    color: form.color || null,
    esterilizado: form.esterilizado,
    observaciones: form.observaciones || null,
    tutor: Number(form.tutor),
  };
}

// ─── Sub-componente: formulario de paciente ───────────────────────────────────

function PacienteFormFields({
  form,
  onChange,
  tutores,
  especies,
  sexos,
}: {
  form: PacienteForm;
  onChange: (updated: PacienteForm) => void;
  tutores: Opcion[];
  especies: Opcion[];
  sexos: Opcion[];
}) {
  const set = (field: keyof PacienteForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onChange({ ...form, [field]: e.target.value });

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <input className="input" placeholder="Nombre *" value={form.nombre} onChange={set("nombre")} />

      <select className="input" value={form.especie} onChange={set("especie")}>
        <option value="">Seleccionar especie *</option>
        {especies.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>

      <input className="input" placeholder="Raza" value={form.raza} onChange={set("raza")} />

      <select className="input" value={form.sexo} onChange={set("sexo")}>
        <option value="">Seleccionar sexo *</option>
        {sexos.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
      </select>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Fecha de nacimiento
        <input className="input" type="date" value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")} />
      </label>

      <input className="input" placeholder="Color" value={form.color} onChange={set("color")} />

      <select className="input" value={form.tutor} onChange={set("tutor")}>
        <option value="">Seleccionar tutor *</option>
        {tutores.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.esterilizado}
          onChange={(e) => onChange({ ...form, esterilizado: e.target.checked })}
        />
        Esterilizado
      </label>

      <textarea
        className="input md:col-span-2"
        placeholder="Observaciones"
        value={form.observaciones}
        onChange={set("observaciones")}
      />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PacientesPage() {
  const { items: pacientes, loading, pagination, setPage, reload } =
    usePaginatedFetch<Paciente>("/pacientes/", "Error cargando pacientes");

  const { confirmOpen, requestDelete, cancelDelete, confirmDelete } =
    useConfirmDelete(
      (id) => `/pacientes/${id}/`,
      reload,
      { success: "Paciente eliminado", error: "No se pudo eliminar el paciente" }
    );

  // Catálogos para los selects
  const [tutores, setTutores] = useState<Opcion[]>([]);
  const [especies, setEspecies] = useState<Opcion[]>([]);
  const [sexos, setSexos] = useState<Opcion[]>([]);

  // Filtros locales
  const [busqueda, setBusqueda] = useState("");
  const [filtroEspecie, setFiltroEspecie] = useState("");
  const [filtroSexo, setFiltroSexo] = useState("");

  // Formulario de creación
  const [form, setForm] = useState<PacienteForm>(FORM_INICIAL);

  // Formulario de edición inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<PacienteForm>(FORM_INICIAL);

  // Cargar catálogos una sola vez al montar
  useEffect(() => {
    const cargarCatalogos = async () => {
      const [resTutores, resEspecies, resSexos] = await Promise.all([
        apiFetch(`${API_ROUTES.tutores}?page_size=${DROPDOWN_PAGE_SIZE}`),
        apiFetch(API_ROUTES.especies),
        apiFetch(API_ROUTES.sexos),
      ]);
      if (resTutores.ok) {
        const data: PaginatedResponse<Opcion> = await resTutores.json();
        setTutores(data.results);
      }
      if (resEspecies.ok) {
        const data = await resEspecies.json();
        setEspecies(data.results ?? data);
      }
      if (resSexos.ok) {
        const data = await resSexos.json();
        setSexos(data.results ?? data);
      }
    };
    cargarCatalogos();
  }, []);

  // ── Filtrado local ────────────────────────────────────────────────────────

  const pacientesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return pacientes.filter((p) => {
      const coincideTexto = `${p.nombre} ${p.tutor_nombre} ${p.especie_nombre ?? ""} ${p.raza ?? ""} ${p.color ?? ""} ${p.sexo_nombre ?? ""}`
        .toLowerCase()
        .includes(q);
      const coincideEspecie = filtroEspecie ? String(p.especie) === filtroEspecie : true;
      const coincideSexo = filtroSexo ? String(p.sexo ?? "") === filtroSexo : true;
      return coincideTexto && coincideEspecie && coincideSexo;
    });
  }, [pacientes, busqueda, filtroEspecie, filtroSexo]);

  const limpiarFiltros = useCallback(() => {
    setBusqueda("");
    setFiltroEspecie("");
    setFiltroSexo("");
  }, []);

  // ── Crear ─────────────────────────────────────────────────────────────────

  const crearPaciente = useCallback(async () => {
    if (!form.nombre || !form.tutor || !form.especie || !form.sexo) {
      toast.warning("Completa nombre, tutor, especie y sexo");
      return;
    }
    const res = await apiFetch("/pacientes/", {
      method: "POST",
      body: JSON.stringify(formToPayload(form)),
    });
    if (!res.ok) { toast.error("No se pudo crear el paciente"); return; }
    toast.success("Paciente creado correctamente");
    setForm(FORM_INICIAL);
    reload();
  }, [form, reload]);

  // ── Editar ────────────────────────────────────────────────────────────────

  const iniciarEdicion = useCallback((p: Paciente) => {
    setEditandoId(p.id);
    setEditForm(pacienteToForm(p));
  }, []);

  const cancelarEdicion = useCallback(() => {
    setEditandoId(null);
    setEditForm(FORM_INICIAL);
  }, []);

  const guardarEdicion = useCallback(async (id: number) => {
    if (!editForm.nombre || !editForm.tutor || !editForm.especie || !editForm.sexo) {
      toast.warning("Completa nombre, tutor, especie y sexo");
      return;
    }
    const res = await apiFetch(`/pacientes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(formToPayload(editForm)),
    });
    if (!res.ok) { toast.error("No se pudo editar el paciente"); return; }
    toast.success("Paciente actualizado");
    cancelarEdicion();
    reload();
  }, [editForm, cancelarEdicion, reload]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">

        <div className="page-header">
          <div>
            <h1 className="title">Pacientes 🐶🐱</h1>
            <p className="text-muted">Gestiona pacientes, fichas clínicas y citas desde un solo lugar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/fichas" className="btn-secondary">Ver fichas</Link>
            <Link href="/citas/nueva" className="btn-primary">Nueva cita</Link>
          </div>
        </div>

        {/* Filtros */}
        <MinimizableSection id="pacientes-filtros" title="🔍 Buscar y filtrar" persistent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              className="input sm:col-span-2"
              placeholder="Buscar por nombre, tutor, especie, raza, sexo o color..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <select className="input" value={filtroEspecie} onChange={(e) => setFiltroEspecie(e.target.value)}>
              <option value="">Todas las especies</option>
              {especies.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <select className="input" value={filtroSexo} onChange={(e) => setFiltroSexo(e.target.value)}>
              <option value="">Todos los sexos</option>
              {sexos.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted">
              Mostrando {pacientesFiltrados.length} de {pacientes.length} pacientes
            </p>
            <button onClick={limpiarFiltros} className="text-sm text-green-700">
              Limpiar filtros
            </button>
          </div>
        </MinimizableSection>

        {/* Formulario crear */}
        <MinimizableSection id="pacientes-crear" title="➕ Crear paciente" persistent>
          <PacienteFormFields
            form={form}
            onChange={setForm}
            tutores={tutores}
            especies={especies}
            sexos={sexos}
          />
          <button onClick={crearPaciente} className="btn-primary mt-4">
            Crear paciente
          </button>
        </MinimizableSection>

        {/* Lista */}
        {loading ? (
          <PageSkeleton rows={5} />
        ) : pacientesFiltrados.length === 0 ? (
          <div className="card">
            <p className="text-muted">No hay pacientes para mostrar.</p>
          </div>
        ) : (
          <section className="space-y-3">
            {pacientesFiltrados.map((p) => (
              <div key={p.id} className="card">
                {editandoId === p.id ? (
                  <div>
                    <h2 className="subtitle mb-4">Editar paciente</h2>
                    <PacienteFormFields
                      form={editForm}
                      onChange={setEditForm}
                      tutores={tutores}
                      especies={especies}
                      sexos={sexos}
                    />
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => guardarEdicion(p.id)} className="btn-primary">
                        Guardar cambios
                      </button>
                      <button onClick={cancelarEdicion} className="btn-secondary">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <Link
                        href={`/pacientes/${p.id}`}
                        className="text-lg font-semibold text-slate-900 hover:underline"
                      >
                        {p.nombre}
                      </Link>
                      <div className="mt-1 text-sm text-muted">
                        {p.especie_nombre || "Sin especie"}
                        {p.raza ? ` · ${p.raza}` : ""}
                        {p.sexo_nombre ? ` · ${p.sexo_nombre}` : ""}
                        {p.fecha_nacimiento ? ` · ${formatEdad(p.fecha_nacimiento)}` : ""}
                        {p.color ? ` · ${p.color}` : ""}
                        {" · Tutor: "}{p.tutor_nombre}
                      </div>
                      {p.observaciones && (
                        <p className="mt-2 text-sm text-slate-700">{p.observaciones}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-nowrap">
                      <Link href={`/pacientes/${p.id}`} className="btn-primary text-center text-sm">
                        Ver ficha
                      </Link>
                      <Link href={`/fichas/nueva?paciente=${p.id}`} className="btn-primary text-center text-sm">
                        Nueva ficha
                      </Link>
                      <Link href={`/citas/nueva?paciente=${p.id}`} className="btn-secondary text-center text-sm">
                        Nueva cita
                      </Link>
                      <button onClick={() => iniciarEdicion(p)} className="btn-secondary text-sm">
                        Editar
                      </button>
                      <button onClick={() => requestDelete(p.id)} className="btn-danger text-sm">
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
        title="Eliminar paciente"
        message="¿Estás seguro? Esta acción eliminará al paciente del sistema."
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </main>
  );
}
