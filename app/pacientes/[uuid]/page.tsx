"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { API_ROUTES, DROPDOWN_PAGE_SIZE } from "@/lib/constants";
import type { Opcion } from "@/lib/types";
import BackButton from "@/app/components/BackButton";
import PageSkeleton from "@/app/components/PageSkeleton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import PacienteForm, { type PacienteFormValues } from "@/app/components/PacienteForm";
import { formatFechaHora, formatEdad } from "@/lib/utils";

function useEdadActualizada(fechaNacimiento: string | null | undefined) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!fechaNacimiento) return;
    const intervalo = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(intervalo);
  }, [fechaNacimiento]);

  return formatEdad(fechaNacimiento);
}

type Paciente = {
  id: number;
  uuid: string;
  nombre: string;
  tutor: number;
  especie: number;
  sexo: number;
  activo: boolean;
  especie_nombre?: string;
  sexo_nombre?: string;
  raza?: string | null;
  color?: string | null;
  chip?: string | null;
  fecha_nacimiento?: string | null;
  esterilizado: boolean;
  observaciones?: string | null;
  tutor_nombre: string;
  tutor_uuid: string;
};

type Vacuna = {
  id: number;
  uuid: string;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis?: string | null;
  observaciones?: string | null;
};

type Ficha = {
  id: number;
  uuid: string;
  fecha: string;
  motivo_consulta: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
};

type Cita = {
  id: number;
  uuid: string;
  fecha_hora: string;
  motivo: string;
  estado: string;
};

type Tratamiento = {
  id: number;
  uuid: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  ficha_clinica_info?: {
    id: number;
    uuid: string;
    fecha: string;
    motivo_consulta: string;
  } | null;
};

type Tab = "vacunas" | "fichas" | "citas" | "tratamientos";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "vacunas", label: "Vacunas", icon: "💉" },
  { id: "fichas", label: "Fichas", icon: "📋" },
  { id: "citas", label: "Citas", icon: "📅" },
  { id: "tratamientos", label: "Tratamientos", icon: "💊" },
];

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "badge-yellow",
  completada: "badge-green",
  cancelada: "badge-red",
};

export default function DetallePacientePage() {
  const params = useParams();
  const router = useRouter();
  const pacienteUuid = params.uuid as string;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);

  const [tutores, setTutores] = useState<Opcion[]>([]);
  const [especies, setEspecies] = useState<Opcion[]>([]);
  const [sexos, setSexos] = useState<Opcion[]>([]);

  const [tab, setTab] = useState<Tab>("vacunas");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [editandoPaciente, setEditandoPaciente] = useState(false);
  const [confirmPacienteOpen, setConfirmPacienteOpen] = useState(false);

  const edadActualizada = useEdadActualizada(paciente?.fecha_nacimiento);

  const vacunaFormInicial = {
    nombre_vacuna: "",
    fecha_aplicacion: "",
    proxima_dosis: "",
    observaciones: "",
  };

  const [vacunaForm, setVacunaForm] = useState(vacunaFormInicial);

  const [vacunaEditando, setVacunaEditando] = useState<number | null>(null);
  const [vacunaEditForm, setVacunaEditForm] = useState({
    nombre_vacuna: "",
    fecha_aplicacion: "",
    proxima_dosis: "",
    observaciones: "",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [vacunaAEliminar, setVacunaAEliminar] = useState<number | null>(null);

  const [tratamientoEditando, setTratamientoEditando] = useState<number | null>(null);
  const [tratamientoEditForm, setTratamientoEditForm] = useState({
    medicamento: "",
    dosis: "",
    frecuencia: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  const [confirmTratamiento, setConfirmTratamiento] = useState(false);
  const [tratamientoAEliminar, setTratamientoAEliminar] = useState<number | null>(null);

  const cargarCatalogos = async () => {
    const [resTutores, resEspecies, resSexos] = await Promise.all([
      apiFetch(`${API_ROUTES.tutores}?page_size=${DROPDOWN_PAGE_SIZE}`),
      apiFetch(API_ROUTES.especies),
      apiFetch(API_ROUTES.sexos),
    ]);

    if (resTutores.ok) {
      const data = await resTutores.json();
      setTutores(data.results ?? data);
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

  const cargarTodo = async () => {
    setLoading(true);

    try {
      const [resPaciente, resVacunas, resFichas, resCitas, resTratamientos] =
        await Promise.all([
          apiFetch(`/pacientes/${pacienteUuid}/`),
          apiFetch(`/vacunas/?paciente=${pacienteUuid}&page_size=200`),
          apiFetch(`/fichas/?paciente=${pacienteUuid}&page_size=200`),
          apiFetch(`/citas/?paciente=${pacienteUuid}&page_size=200`),
          apiFetch(`/tratamientos/?paciente=${pacienteUuid}&page_size=200`),
        ]);

      if (resPaciente.ok) {
        const data = await resPaciente.json();
        setPaciente(data);
      }

      if (resVacunas.ok) {
        const d = await resVacunas.json();
        setVacunas(d.results ?? d);
      }

      if (resFichas.ok) {
        const d = await resFichas.json();
        setFichas(d.results ?? d);
      }

      if (resCitas.ok) {
        const d = await resCitas.json();
        setCitas(d.results ?? d);
      }

      if (resTratamientos.ok) {
        const d = await resTratamientos.json();
        setTratamientos(d.results ?? d);
      }
    } catch {
      toast.error("Error cargando datos del paciente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [pacienteUuid]);

  const guardarPaciente = async (data: PacienteFormValues) => {
    try {
      setGuardando(true);

      const res = await apiFetch(`/pacientes/${pacienteUuid}/`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre: data.nombre,
          especie: Number(data.especie),
          raza: data.raza || null,
          sexo: Number(data.sexo),
          fecha_nacimiento: data.fecha_nacimiento || null,
          color: data.color || null,
          esterilizado: data.esterilizado,
          chip: data.chip || null,
          observaciones: data.observaciones || null,
          tutor: Number(data.tutor),
          activo: data.activo,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo actualizar el paciente");
        return;
      }

      toast.success("Paciente actualizado");
      setEditandoPaciente(false);
      cargarTodo();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPaciente = async () => {
    setConfirmPacienteOpen(false);

    try {
      setGuardando(true);

      const res = await apiFetch(`/pacientes/${pacienteUuid}/`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("No se pudo eliminar el paciente");
        return;
      }

      toast.success("Paciente eliminado");
      router.push("/pacientes");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const crearVacuna = async () => {
    if (!vacunaForm.nombre_vacuna || !vacunaForm.fecha_aplicacion) {
      toast.warning("Nombre y fecha son obligatorios");
      return;
    }

    try {
      setGuardando(true);

      const res = await apiFetch("/vacunas/", {
        method: "POST",
        body: JSON.stringify({
          paciente: pacienteUuid,
          nombre_vacuna: vacunaForm.nombre_vacuna,
          fecha_aplicacion: vacunaForm.fecha_aplicacion,
          proxima_dosis: vacunaForm.proxima_dosis || null,
          observaciones: vacunaForm.observaciones || null,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo registrar la vacuna");
        return;
      }

      toast.success("Vacuna registrada");
      setVacunaForm(vacunaFormInicial);

      const r = await apiFetch(`/vacunas/?paciente=${pacienteUuid}&page_size=200`);
      if (r.ok) {
        const d = await r.json();
        setVacunas(d.results ?? d);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarVacuna = async () => {
    if (!vacunaAEliminar) return;

    setConfirmOpen(false);

    try {
      const res = await apiFetch(`/vacunas/${vacunaAEliminar}/`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("No se pudo eliminar la vacuna");
        return;
      }

      toast.success("Vacuna eliminada");
      setVacunas((v) => v.filter((x) => x.id !== vacunaAEliminar));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setVacunaAEliminar(null);
    }
  };

  const iniciarEdicionVacuna = (v: Vacuna) => {
    setVacunaEditando(v.id);
    setVacunaEditForm({
      nombre_vacuna: v.nombre_vacuna,
      fecha_aplicacion: v.fecha_aplicacion,
      proxima_dosis: v.proxima_dosis || "",
      observaciones: v.observaciones || "",
    });
  };

  const editarVacuna = async (id: number) => {
    try {
      const res = await apiFetch(`/vacunas/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre_vacuna: vacunaEditForm.nombre_vacuna,
          fecha_aplicacion: vacunaEditForm.fecha_aplicacion,
          proxima_dosis: vacunaEditForm.proxima_dosis || null,
          observaciones: vacunaEditForm.observaciones || null,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo editar la vacuna");
        return;
      }

      toast.success("Vacuna actualizada");
      setVacunaEditando(null);

      const r = await apiFetch(`/vacunas/?paciente=${pacienteUuid}&page_size=200`);
      if (r.ok) {
        const d = await r.json();
        setVacunas(d.results ?? d);
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const vacunaVencida = (fecha: string) => new Date(fecha) < new Date();

  const iniciarEdicionTratamiento = (t: Tratamiento) => {
    setTratamientoEditando(t.id);
    setTratamientoEditForm({
      medicamento: t.medicamento,
      dosis: t.dosis,
      frecuencia: t.frecuencia,
      fecha_inicio: t.fecha_inicio,
      fecha_fin: t.fecha_fin || "",
    });
  };

  const editarTratamiento = async (id: number) => {
    try {
      const res = await apiFetch(`/tratamientos/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          medicamento: tratamientoEditForm.medicamento,
          dosis: tratamientoEditForm.dosis,
          frecuencia: tratamientoEditForm.frecuencia,
          fecha_inicio: tratamientoEditForm.fecha_inicio,
          fecha_fin: tratamientoEditForm.fecha_fin || null,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo editar el tratamiento");
        return;
      }

      toast.success("Tratamiento actualizado");
      setTratamientoEditando(null);

      const r = await apiFetch(`/tratamientos/?paciente=${pacienteUuid}&page_size=200`);
      if (r.ok) {
        const d = await r.json();
        setTratamientos(d.results ?? d);
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const eliminarTratamiento = async () => {
    if (!tratamientoAEliminar) return;

    setConfirmTratamiento(false);

    try {
      const res = await apiFetch(`/tratamientos/${tratamientoAEliminar}/`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("No se pudo eliminar el tratamiento");
        return;
      }

      toast.success("Tratamiento eliminado");
      setTratamientos((t) => t.filter((x) => x.id !== tratamientoAEliminar));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setTratamientoAEliminar(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="skeleton h-5 w-40 mb-6 rounded" />
          <PageSkeleton rows={4} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="page-header">
          <div>
            <BackButton href="/pacientes" label="Volver a pacientes" />
            <h1 className="title mt-2">{paciente?.nombre ?? "Paciente"}</h1>

            {paciente && (
              <p className="text-muted">
                {paciente.especie_nombre ?? "Sin especie"}
                {paciente.raza ? ` · ${paciente.raza}` : ""}
                {paciente.sexo_nombre ? ` · ${paciente.sexo_nombre}` : ""}
                {paciente.fecha_nacimiento ? ` · ${edadActualizada}` : ""}
                {paciente.chip ? ` · Chip: ${paciente.chip}` : ""}
                {" · Tutor: "}
                <Link href={`/tutores/${paciente.tutor_uuid}`} className="text-green-700 hover:underline">
                  {paciente.tutor_nombre}
                </Link>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEditandoPaciente((v) => !v)}
              className="btn-secondary"
            >
              {editandoPaciente ? "Cancelar edición" : "Editar paciente"}
            </button>

            <button
              onClick={() => setConfirmPacienteOpen(true)}
              className="btn-danger"
            >
              Eliminar paciente
            </button>

            <Link href={`/fichas/nueva?paciente=${pacienteUuid}`} className="btn-primary">
              + Nueva ficha
            </Link>
          </div>
        </div>

        {paciente && (
          <section className="card">
            <h2 className="subtitle mb-4">Datos del paciente</h2>

            {editandoPaciente ? (
              <PacienteForm
                defaultValues={{
                  nombre: paciente.nombre,
                  especie: String(paciente.especie ?? ""),
                  raza: paciente.raza ?? "",
                  sexo: String(paciente.sexo ?? ""),
                  fecha_nacimiento: paciente.fecha_nacimiento ?? "",
                  color: paciente.color ?? "",
                  tutor: String(paciente.tutor ?? ""),
                  chip: paciente.chip ?? "",
                  observaciones: paciente.observaciones ?? "",
                  esterilizado: paciente.esterilizado,
                  activo: paciente.activo,
                }}
                tutores={tutores}
                especies={especies}
                sexos={sexos}
                submitLabel="Guardar cambios"
                onCancel={() => setEditandoPaciente(false)}
                onSubmit={guardarPaciente}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-muted">Especie</p>
                    <p className="font-medium">{paciente.especie_nombre ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Raza</p>
                    <p className="font-medium">{paciente.raza ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Sexo</p>
                    <p className="font-medium">{paciente.sexo_nombre ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Edad</p>
                    <p className="font-medium">{edadActualizada ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Color</p>
                    <p className="font-medium">{paciente.color ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Chip</p>
                    <p className="font-medium">{paciente.chip ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Esterilizado</p>
                    <p className="font-medium">{paciente.esterilizado ? "Sí" : "No"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Estado</p>
                    <p className="font-medium">{paciente.activo ? "Activo" : "Inactivo"}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-muted">Tutor</p>
                    <Link
                      href={`/tutores/${paciente.tutor_uuid}`}
                      className="font-medium text-green-700 hover:underline"
                    >
                      {paciente.tutor_nombre}
                    </Link>
                  </div>
                </div>

                {paciente.observaciones && (
                  <div className="mt-4">
                    <p className="text-muted">Observaciones</p>
                    <p className="mt-1">{paciente.observaciones}</p>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Acciones rápidas */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href={`/fichas/nueva?paciente=${pacienteUuid}`} className="btn-primary text-sm">
            + Nueva ficha
          </Link>
          <Link href={`/vacunas/nueva?paciente=${pacienteUuid}`} className="btn-secondary text-sm">
            + Vacuna
          </Link>
          <Link href={`/tratamientos/nuevo?paciente=${pacienteUuid}`} className="btn-secondary text-sm">
            + Tratamiento
          </Link>
          <Link href={`/archivos/nuevo?paciente=${pacienteUuid}`} className="btn-secondary text-sm">
            + Documento
          </Link>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
            {TABS.map((t) => {
              const count =
                t.id === "vacunas"
                  ? vacunas.length
                  : t.id === "fichas"
                  ? fichas.length
                  : t.id === "citas"
                  ? citas.length
                  : tratamientos.length;

              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1 px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                    tab === t.id
                      ? "border-green-600 text-green-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="text-sm md:text-base">{t.icon}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        tab === t.id
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {tab === "vacunas" && (
            <div className="space-y-4">
              <div className="card">
                <h3 className="subtitle mb-4">Registrar vacuna</h3>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="input"
                    placeholder="Nombre vacuna *"
                    value={vacunaForm.nombre_vacuna}
                    onChange={(e) =>
                      setVacunaForm({ ...vacunaForm, nombre_vacuna: e.target.value })
                    }
                  />

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Fecha de aplicación *
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={vacunaForm.fecha_aplicacion}
                      onChange={(e) =>
                        setVacunaForm({ ...vacunaForm, fecha_aplicacion: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Próxima dosis
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={vacunaForm.proxima_dosis}
                      onChange={(e) =>
                        setVacunaForm({ ...vacunaForm, proxima_dosis: e.target.value })
                      }
                    />
                  </div>

                  <textarea
                    className="input"
                    placeholder="Observaciones"
                    value={vacunaForm.observaciones}
                    onChange={(e) =>
                      setVacunaForm({ ...vacunaForm, observaciones: e.target.value })
                    }
                  />
                </div>

                <button onClick={crearVacuna} disabled={guardando} className="btn-primary mt-4">
                  {guardando ? "Guardando..." : "Guardar vacuna"}
                </button>
              </div>

              {vacunas.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted">Sin vacunas registradas.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vacunas.map((v) => (
                    <div key={v.uuid} className="card">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{v.nombre_vacuna}</p>
                            {v.proxima_dosis && vacunaVencida(v.proxima_dosis) && (
                              <span className="badge-red">Vencida</span>
                            )}
                          </div>

                          <p className="text-muted">Aplicada: {v.fecha_aplicacion}</p>

                          {v.proxima_dosis && (
                            <p
                              className={`text-sm font-medium ${
                                vacunaVencida(v.proxima_dosis)
                                  ? "text-red-600"
                                  : "text-orange-600"
                              }`}
                            >
                              Próxima: {v.proxima_dosis}
                            </p>
                          )}

                          {v.observaciones && (
                            <p className="text-muted mt-1">{v.observaciones}</p>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => iniciarEdicionVacuna(v)} className="btn-secondary">
                            Editar
                          </button>

                          <button
                            onClick={() => {
                              setVacunaAEliminar(v.id);
                              setConfirmOpen(true);
                            }}
                            className="btn-danger"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {vacunaEditando === v.id && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">
                            Editar vacuna
                          </h4>

                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              className="input"
                              placeholder="Nombre vacuna *"
                              value={vacunaEditForm.nombre_vacuna}
                              onChange={(e) =>
                                setVacunaEditForm({
                                  ...vacunaEditForm,
                                  nombre_vacuna: e.target.value,
                                })
                              }
                            />

                            <input
                              type="date"
                              className="input"
                              value={vacunaEditForm.fecha_aplicacion}
                              onChange={(e) =>
                                setVacunaEditForm({
                                  ...vacunaEditForm,
                                  fecha_aplicacion: e.target.value,
                                })
                              }
                            />

                            <input
                              type="date"
                              className="input"
                              value={vacunaEditForm.proxima_dosis}
                              onChange={(e) =>
                                setVacunaEditForm({
                                  ...vacunaEditForm,
                                  proxima_dosis: e.target.value,
                                })
                              }
                            />

                            <textarea
                              className="input"
                              placeholder="Observaciones"
                              value={vacunaEditForm.observaciones}
                              onChange={(e) =>
                                setVacunaEditForm({
                                  ...vacunaEditForm,
                                  observaciones: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="flex gap-2 mt-3">
                            <button onClick={() => editarVacuna(v.id)} className="btn-primary">
                              Guardar cambios
                            </button>
                            <button onClick={() => setVacunaEditando(null)} className="btn-secondary">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "fichas" && (
            <div className="space-y-2">
              {fichas.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted mb-3">Sin fichas clínicas.</p>
                  <Link href={`/fichas/nueva?paciente=${pacienteUuid}`} className="btn-primary">
                    Crear primera ficha
                  </Link>
                </div>
              ) : (
                fichas.map((f) => (
                  <Link
                    key={f.uuid}
                    href={`/fichas/${f.uuid}`}
                    className="card flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="text-muted">{formatFechaHora(f.fecha)}</p>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {f.motivo_consulta}
                      </p>
                      {f.diagnostico && (
                        <p className="text-muted mt-0.5">Dx: {f.diagnostico}</p>
                      )}
                    </div>
                    <span className="text-slate-400 shrink-0">→</span>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "citas" && (
            <div className="space-y-2">
              {citas.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted">Sin citas registradas.</p>
                </div>
              ) : (
                citas.map((c) => (
                  <div key={c.uuid} className="card flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={ESTADO_BADGE[c.estado] ?? "badge-slate"}>
                          {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                        </span>
                        <p className="text-muted">{formatFechaHora(c.fecha_hora)}</p>
                      </div>
                      <p className="font-semibold text-slate-900">{c.motivo}</p>
                    </div>

                    {c.estado === "pendiente" && (
                      <Link
                        href={`/fichas/nueva?paciente=${pacienteUuid}&cita=${c.uuid}`}
                        className="btn-primary shrink-0"
                      >
                        Atender
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "tratamientos" && (
            <div className="space-y-2">
              {tratamientos.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted mb-3">Sin tratamientos registrados.</p>
                  <Link href={`/tratamientos/nuevo?paciente=${pacienteUuid}`} className="btn-primary">
                    Agregar tratamiento
                  </Link>
                </div>
              ) : (
                tratamientos.map((t) => {
                  const activo = !t.fecha_fin || new Date(t.fecha_fin) >= new Date();

                  return (
                    <div key={t.uuid} className="card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{t.medicamento}</p>
                            {activo && <span className="badge-green">Activo</span>}
                            {t.ficha_clinica_info && (
                              <Link
                                href={`/fichas/${t.ficha_clinica_info.uuid}`}
                                className="badge-blue hover:underline"
                              >
                                Ficha {new Date(t.ficha_clinica_info.fecha).toLocaleDateString()}
                              </Link>
                            )}
                          </div>

                          <p className="text-muted">
                            {t.dosis} · {t.frecuencia}
                          </p>
                          <p className="text-muted">
                            {t.fecha_inicio} → {t.fecha_fin ?? "indefinido"}
                          </p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => iniciarEdicionTratamiento(t)} className="btn-secondary">
                            Editar
                          </button>

                          <button
                            onClick={() => {
                              setTratamientoAEliminar(t.id);
                              setConfirmTratamiento(true);
                            }}
                            className="btn-danger"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {tratamientoEditando === t.id && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">
                            Editar tratamiento
                          </h4>

                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              className="input"
                              placeholder="Medicamento *"
                              value={tratamientoEditForm.medicamento}
                              onChange={(e) =>
                                setTratamientoEditForm({
                                  ...tratamientoEditForm,
                                  medicamento: e.target.value,
                                })
                              }
                            />

                            <input
                              className="input"
                              placeholder="Dosis *"
                              value={tratamientoEditForm.dosis}
                              onChange={(e) =>
                                setTratamientoEditForm({
                                  ...tratamientoEditForm,
                                  dosis: e.target.value,
                                })
                              }
                            />

                            <input
                              className="input"
                              placeholder="Frecuencia *"
                              value={tratamientoEditForm.frecuencia}
                              onChange={(e) =>
                                setTratamientoEditForm({
                                  ...tratamientoEditForm,
                                  frecuencia: e.target.value,
                                })
                              }
                            />

                            <input
                              type="date"
                              className="input"
                              value={tratamientoEditForm.fecha_inicio}
                              onChange={(e) =>
                                setTratamientoEditForm({
                                  ...tratamientoEditForm,
                                  fecha_inicio: e.target.value,
                                })
                              }
                            />

                            <input
                              type="date"
                              className="input"
                              value={tratamientoEditForm.fecha_fin}
                              onChange={(e) =>
                                setTratamientoEditForm({
                                  ...tratamientoEditForm,
                                  fecha_fin: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="flex gap-2 mt-3">
                            <button onClick={() => editarTratamiento(t.id)} className="btn-primary">
                              Guardar cambios
                            </button>

                            <button
                              onClick={() => setTratamientoEditando(null)}
                              className="btn-secondary"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}