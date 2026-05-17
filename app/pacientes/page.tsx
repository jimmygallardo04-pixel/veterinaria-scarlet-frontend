"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch, type PaginatedResponse } from "@/lib/api";
import { usePaginatedFetch } from "@/lib/hooks/usePaginatedFetch";
import { useConfirmDelete } from "@/lib/hooks/useConfirmDelete";
import { API_ROUTES, DROPDOWN_PAGE_SIZE } from "@/lib/constants";
import type { Paciente, Opcion } from "@/lib/types";
import PageSkeleton from "@/app/components/PageSkeleton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import Pagination from "@/app/components/Pagination";
import MinimizableSection from "@/app/components/MinimizableSection";
import BackButton from "@/app/components/BackButton";
import SearchableSelect, { type SearchableOption } from "@/app/components/SearchableSelect";
import { formatEdad } from "@/lib/utils";

const pacienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  especie: z.string().min(1, "La especie es obligatoria"),
  raza: z.string().optional(),
  sexo: z.string().min(1, "El sexo es obligatorio"),
  fecha_nacimiento: z.string().optional(),
  color: z.string().optional(),
  esterilizado: z.boolean(),
  chip: z.string().optional(),
  observaciones: z.string().optional(),
  tutor: z.string().min(1, "El tutor es obligatorio"),
  activo: z.boolean(),
});

type PacienteFormValues = z.infer<typeof pacienteSchema>;

function formToPayload(form: PacienteFormValues) {
  return {
    nombre: form.nombre,
    especie: Number(form.especie),
    raza: form.raza || null,
    sexo: Number(form.sexo),
    fecha_nacimiento: form.fecha_nacimiento || null,
    color: form.color || null,
    esterilizado: form.esterilizado,
    chip: form.chip || null,
    observaciones: form.observaciones || null,
    tutor: Number(form.tutor),
    activo: form.activo,
  };
}

// ─── Sub-componente: formulario de paciente (React Hook Form) ───────────────

function PacienteForm({
  defaultValues,
  onSubmit,
  tutores,
  especies,
  sexos,
  onCancel,
  submitLabel = "Guardar",
}: {
  defaultValues?: Partial<PacienteFormValues>;
  onSubmit: (data: PacienteFormValues) => Promise<void>;
  tutores: Opcion[];
  especies: Opcion[];
  sexos: Opcion[];
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      nombre: "",
      especie: "",
      raza: "",
      sexo: "",
      fecha_nacimiento: "",
      color: "",
      esterilizado: false,
      chip: "",
      observaciones: "",
      tutor: "",
      activo: true,
      ...defaultValues,
    },
  });

  const especieValue = watch("especie");
  const sexoValue = watch("sexo");
  const tutorValue = watch("tutor");
  const esterilizadoValue = watch("esterilizado");
  const activoValue = watch("activo");

  const tutoresOptions: SearchableOption[] = tutores.map((t) => ({ id: t.id, nombre: t.nombre }));
  const especiesOptions: SearchableOption[] = especies.map((e) => ({ id: e.id, nombre: e.nombre }));
  const sexosOptions: SearchableOption[] = sexos.map((s) => ({ id: s.id, nombre: s.nombre }));

  const handleFormSubmit = async (data: PacienteFormValues) => {
    await onSubmit(data);
    if (!defaultValues?.nombre) {
      reset(); // Solo resetear si es creación
      setValue("especie", "");
      setValue("sexo", "");
      setValue("tutor", "");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <input className="input w-full" placeholder="Nombre *" {...register("nombre")} />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
        </div>

        <div>
          <SearchableSelect
            options={especiesOptions}
            value={especieValue}
            onChange={(val) => setValue("especie", val, { shouldValidate: true })}
            placeholder="Buscar especie..."
            emptyMessage="No se encontraron especies"
            label="Especie *"
            required
          />
          {errors.especie && <p className="text-red-500 text-xs mt-1">{errors.especie.message}</p>}
        </div>

        <div>
          <input className="input w-full" placeholder="Raza" {...register("raza")} />
        </div>

        <div>
          <SearchableSelect
            options={sexosOptions}
            value={sexoValue}
            onChange={(val) => setValue("sexo", val, { shouldValidate: true })}
            placeholder="Buscar sexo..."
            emptyMessage="No se encontraron sexos"
            label="Sexo *"
            required
          />
          {errors.sexo && <p className="text-red-500 text-xs mt-1">{errors.sexo.message}</p>}
        </div>

        <div>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Fecha de nacimiento
            <input className="input w-full" type="date" {...register("fecha_nacimiento")} />
          </label>
        </div>

        <div>
          <input className="input w-full" placeholder="Color" {...register("color")} />
        </div>

        <div>
          <SearchableSelect
            options={tutoresOptions}
            value={tutorValue}
            onChange={(val) => setValue("tutor", val, { shouldValidate: true })}
            placeholder="Buscar tutor por nombre..."
            emptyMessage="No se encontraron tutores"
            label="Tutor *"
            required
          />
          {errors.tutor && <p className="text-red-500 text-xs mt-1">{errors.tutor.message}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-700 h-full">
            <input type="checkbox" checked={esterilizadoValue} {...register("esterilizado")} />
            Esterilizado
          </label>
        </div>

        <div>
          <input className="input w-full" placeholder="Número de chip" {...register("chip")} />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-700 h-full">
            <input type="checkbox" checked={activoValue} {...register("activo")} />
            Paciente activo
          </label>
        </div>

        <div className="md:col-span-2">
          <textarea className="input w-full" placeholder="Observaciones" {...register("observaciones")} />
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Guardando..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PacientesPage() {
  const { items: pacientes, loading, pagination, setPage, reload } =
    usePaginatedFetch<Paciente>("/pacientes/", "Error cargando pacientes");

  const { confirmOpen, requestDelete, cancelDelete, confirmDelete } =
    useConfirmDelete(
      (uuid) => `/pacientes/${uuid}/`,
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
  const [filtroActivo, setFiltroActivo] = useState("");

  // Formulario de edición inline
  const [editandoId, setEditandoId] = useState<string | null>(null);

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
      const coincideActivo = filtroActivo === "" ? true : filtroActivo === "true" ? p.activo : !p.activo;
      return coincideTexto && coincideEspecie && coincideSexo && coincideActivo;
    });
  }, [pacientes, busqueda, filtroEspecie, filtroSexo, filtroActivo]);

  const limpiarFiltros = useCallback(() => {
    setBusqueda("");
    setFiltroEspecie("");
    setFiltroSexo("");
    setFiltroActivo("");
  }, []);

  // ── Crear ─────────────────────────────────────────────────────────────────

  const crearPaciente = useCallback(async (data: PacienteFormValues) => {
    const res = await apiFetch("/pacientes/", {
      method: "POST",
      body: JSON.stringify(formToPayload(data)),
    });
    if (!res.ok) { toast.error("No se pudo crear el paciente"); return; }
    toast.success("Paciente creado correctamente");
    reload();
  }, [reload]);

  // ── Editar ────────────────────────────────────────────────────────────────

  const iniciarEdicion = useCallback((p: Paciente) => {
    setEditandoId(p.uuid);
  }, []);

  const cancelarEdicion = useCallback(() => {
    setEditandoId(null);
  }, []);

  const guardarEdicion = useCallback(async (uuid: string, data: PacienteFormValues) => {
    const res = await apiFetch(`/pacientes/${uuid}/`, {
      method: "PATCH",
      body: JSON.stringify(formToPayload(data)),
    });
    if (!res.ok) { toast.error("No se pudo editar el paciente"); return; }
    toast.success("Paciente actualizado");
    cancelarEdicion();
    reload();
  }, [cancelarEdicion, reload]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2">
          <BackButton href="/dashboard" label="Volver al dashboard" />
        </div>
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
            <select className="input" value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
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
          <PacienteForm
            onSubmit={crearPaciente}
            tutores={tutores}
            especies={especies}
            sexos={sexos}
            submitLabel="Crear paciente"
          />
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
                {editandoId === p.uuid ? (
                  <div>
                    <h2 className="subtitle mb-4">Editar paciente</h2>
                    <PacienteForm
                      defaultValues={{
                        nombre: p.nombre,
                        especie: String(p.especie),
                        raza: p.raza ?? "",
                        sexo: p.sexo ? String(p.sexo) : "",
                        fecha_nacimiento: p.fecha_nacimiento ?? "",
                        color: p.color ?? "",
                        esterilizado: p.esterilizado,
                        chip: p.chip ?? "",
                        observaciones: p.observaciones ?? "",
                        tutor: String(p.tutor),
                        activo: p.activo,
                      }}
                      onSubmit={(data) => guardarEdicion(p.uuid, data)}
                      onCancel={cancelarEdicion}
                      tutores={tutores}
                      especies={especies}
                      sexos={sexos}
                      submitLabel="Guardar cambios"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/pacientes/${p.uuid}`}
                          className="text-lg font-semibold text-slate-900 hover:underline"
                        >
                          {p.nombre}
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-muted">
                        {p.especie_nombre || "Sin especie"}
                        {p.raza ? ` · ${p.raza}` : ""}
                        {p.sexo_nombre ? ` · ${p.sexo_nombre}` : ""}
                        {p.fecha_nacimiento ? ` · ${formatEdad(p.fecha_nacimiento)}` : ""}
                        {p.color ? ` · ${p.color}` : ""}
                        {p.chip ? ` · Chip: ${p.chip}` : ""}
                        {" · Tutor: "}
                        <Link href={`/tutores/${p.tutor_uuid}`} className="text-green-700 hover:underline">
                          {p.tutor_nombre}
                        </Link>
                      </div>
                      {p.observaciones && (
                        <p className="mt-2 text-sm text-slate-700">{p.observaciones}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-nowrap">
                      <Link href={`/pacientes/${p.uuid}`} className="btn-primary text-center text-sm">
                        Ver ficha
                      </Link>
                      <Link href={`/fichas/nueva?paciente=${p.uuid}`} className="btn-primary text-center text-sm">
                        Nueva ficha
                      </Link>
                      <Link href={`/citas/nueva?paciente=${p.uuid}`} className="btn-secondary text-center text-sm">
                        Nueva cita
                      </Link>
                      <button onClick={() => iniciarEdicion(p)} className="btn-secondary text-sm">
                        Editar
                      </button>
                      <button onClick={() => requestDelete(p.uuid)} className="btn-danger text-sm">
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
        requireKeyword="ELIMINAR"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </main>
  );
}
