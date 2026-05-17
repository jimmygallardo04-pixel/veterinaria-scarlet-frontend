"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { API_ROUTES, DROPDOWN_PAGE_SIZE } from "@/lib/constants";
import type { Tutor, Paciente, Opcion } from "@/lib/types";
import BackButton from "@/app/components/BackButton";
import PageSkeleton from "@/app/components/PageSkeleton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import PacienteForm, { type PacienteFormValues } from "@/app/components/PacienteForm";
import TutorForm, {
  TUTOR_FORM_INICIAL,
  tutorToForm,
  type TutorFormValues,
} from "@/app/components/TutorForm";

type PacienteConTutor = Paciente & {
  especie_nombre?: string | null;
  sexo_nombre?: string | null;
};

export default function DetalleTutorPage() {
  const params = useParams();
  const router = useRouter();
  const tutorUuid = params.uuid as string;

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [pacientes, setPacientes] = useState<PacienteConTutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [tutores, setTutores] = useState<Opcion[]>([]);
  const [especies, setEspecies] = useState<Opcion[]>([]);
  const [sexos, setSexos] = useState<Opcion[]>([]);

  const [editandoTutor, setEditandoTutor] = useState(false);
  const [tutorForm, setTutorForm] = useState<TutorFormValues>(TUTOR_FORM_INICIAL);

  const [creandoPaciente, setCreandoPaciente] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState<string | null>(null);

  const [confirmTutorOpen, setConfirmTutorOpen] = useState(false);
  const [confirmPacienteOpen, setConfirmPacienteOpen] = useState(false);
  const [pacienteAEliminar, setPacienteAEliminar] = useState<string | null>(null);

  const pacienteToPayload = (data: PacienteFormValues) => ({
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
  });

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

  const cargarDatos = async () => {
    setLoading(true);

    try {
      const [resTutor, resPacientes] = await Promise.all([
        apiFetch(`/tutores/${tutorUuid}/`),
        apiFetch(`/pacientes/?tutor=${tutorUuid}&page_size=200`),
      ]);

      if (resTutor.ok) {
        const data = await resTutor.json();
        setTutor(data);
        setTutorForm(tutorToForm(data));
      } else if (resTutor.status === 404) {
        toast.error("Tutor no encontrado");
        router.push("/tutores");
      }

      if (resPacientes.ok) {
        const data = await resPacientes.json();
        setPacientes(data.results ?? data);
      }
    } catch {
      toast.error("Error cargando datos del tutor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [tutorUuid]);

  const guardarTutor = async () => {
    if (!tutorForm.nombre || !tutorForm.telefono) {
      toast.warning("Nombre y teléfono son obligatorios");
      return;
    }

    try {
      setGuardando(true);

      const res = await apiFetch(`/tutores/${tutorUuid}/`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre: tutorForm.nombre,
          rut: tutorForm.rut || null,
          telefono: tutorForm.telefono,
          email: tutorForm.email || null,
          direccion: tutorForm.direccion || null,
          activo: tutorForm.activo,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo actualizar el tutor");
        return;
      }

      toast.success("Tutor actualizado");
      setEditandoTutor(false);
      cargarDatos();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarTutor = async () => {
    setConfirmTutorOpen(false);

    try {
      setGuardando(true);

      const res = await apiFetch(`/tutores/${tutorUuid}/`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("No se pudo eliminar el tutor");
        return;
      }

      toast.success("Tutor eliminado");
      router.push("/tutores");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const crearPaciente = async (data: PacienteFormValues) => {
    try {
      setGuardando(true);

      const res = await apiFetch("/pacientes/", {
        method: "POST",
        body: JSON.stringify(pacienteToPayload(data)),
      });

      if (!res.ok) {
        toast.error("No se pudo crear la mascota");
        return;
      }

      toast.success("Mascota creada");
      setCreandoPaciente(false);
      cargarDatos();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicionPaciente = (paciente: PacienteConTutor) => {
    setPacienteEditando(paciente.uuid);
    setCreandoPaciente(false);
  };

  const cancelarEdicionPaciente = () => {
    setPacienteEditando(null);
  };

  const guardarPaciente = async (uuid: string, data: PacienteFormValues) => {
    try {
      setGuardando(true);

      const res = await apiFetch(`/pacientes/${uuid}/`, {
        method: "PATCH",
        body: JSON.stringify(pacienteToPayload(data)),
      });

      if (!res.ok) {
        toast.error("No se pudo actualizar la mascota");
        return;
      }

      toast.success("Mascota actualizada");
      cancelarEdicionPaciente();
      cargarDatos();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPaciente = async () => {
    if (!pacienteAEliminar) return;

    setConfirmPacienteOpen(false);

    try {
      setGuardando(true);

      const res = await apiFetch(`/pacientes/${pacienteAEliminar}/`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("No se pudo eliminar la mascota");
        return;
      }

      toast.success("Mascota eliminada");
      setPacienteAEliminar(null);
      cancelarEdicionPaciente();
      cargarDatos();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
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

  if (!tutor) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="card text-center py-10">
            <p className="text-muted">Tutor no encontrado</p>
            <Link href="/tutores" className="btn-primary mt-4">
              Volver a tutores
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="page-header">
          <div>
            <BackButton href="/tutores" label="Volver a tutores" />
            <h1 className="title mt-2">{tutor.nombre}</h1>
            <p className="text-muted">
              {tutor.telefono}
              {tutor.rut ? ` · ${tutor.rut}` : ""}
              {tutor.email ? ` · ${tutor.email}` : ""}
              {!tutor.activo && <span className="ml-2 badge-red">Inactivo</span>}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditandoTutor((v) => !v)}
              className="btn-secondary"
            >
              {editandoTutor ? "Cancelar edición" : "Editar tutor"}
            </button>

            <button onClick={() => setConfirmTutorOpen(true)} className="btn-danger">
              Eliminar tutor
            </button>
          </div>
        </div>

        <section className="card">
          <h2 className="subtitle mb-4">Datos del tutor</h2>

          {editandoTutor ? (
            <div>
              <TutorForm
                value={tutorForm}
                onChange={setTutorForm}
                onSubmit={guardarTutor}
                onCancel={() => setEditandoTutor(false)}
                guardando={guardando}
                submitLabel="Guardar tutor"
              />

              <div className="mt-3">
                <button onClick={() => setConfirmTutorOpen(true)} className="btn-danger">
                  Eliminar tutor
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
              <div>
                <p className="text-muted text-xs">Nombre</p>
                <p className="font-medium">{tutor.nombre}</p>
              </div>

              <div>
                <p className="text-muted text-xs">RUT</p>
                <p className="font-medium">{tutor.rut ?? "-"}</p>
              </div>

              <div>
                <p className="text-muted text-xs">Teléfono</p>
                <p className="font-medium">{tutor.telefono}</p>
              </div>

              <div>
                <p className="text-muted text-xs">Email</p>
                <p className="font-medium">{tutor.email ?? "-"}</p>
              </div>

              <div className="col-span-2">
                <p className="text-muted text-xs">Dirección</p>
                <p className="font-medium">{tutor.direccion ?? "-"}</p>
              </div>

              <div>
                <p className="text-muted text-xs">Estado</p>
                <p className="font-medium">{tutor.activo ? "Activo" : "Inactivo"}</p>
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="subtitle">Mascotas asociadas ({pacientes.length})</h2>

            <button
              onClick={() => {
                setCreandoPaciente((v) => !v);
                setPacienteEditando(null);
              }}
              className="btn-primary text-sm"
            >
              {creandoPaciente ? "Cancelar creación" : "+ Nueva mascota"}
            </button>
          </div>

          {creandoPaciente && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900 mb-3">
                Nueva mascota para {tutor.nombre}
              </h3>

              <PacienteForm
                defaultValues={{
                  tutor: String(tutor.id),
                  activo: true,
                  esterilizado: false,
                }}
                tutores={tutores}
                especies={especies}
                sexos={sexos}
                submitLabel="Crear mascota"
                onCancel={() => setCreandoPaciente(false)}
                onSubmit={crearPaciente}
              />
            </div>
          )}

          {pacientes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted">Este tutor no tiene mascotas registradas.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {pacientes.map((paciente) => (
                <div
                  key={paciente.uuid}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  {pacienteEditando === paciente.uuid ? (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">
                        Editar mascota
                      </h3>

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
                          esterilizado: paciente.esterilizado ?? false,
                          activo: paciente.activo ?? true,
                        }}
                        tutores={tutores}
                        especies={especies}
                        sexos={sexos}
                        submitLabel="Guardar cambios"
                        onCancel={cancelarEdicionPaciente}
                        onSubmit={(data) => guardarPaciente(paciente.uuid, data)}
                      />

                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setPacienteAEliminar(paciente.uuid);
                            setConfirmPacienteOpen(true);
                          }}
                          className="btn-danger text-sm"
                        >
                          Eliminar mascota
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <Link
                            href={`/pacientes/${paciente.uuid}`}
                            className="text-lg font-semibold text-slate-900 hover:underline"
                          >
                            {paciente.nombre}
                          </Link>

                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              paciente.activo
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {paciente.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <p className="text-muted text-sm mt-1">
                          {paciente.especie_nombre ?? "Sin especie"}
                          {paciente.raza ? ` · ${paciente.raza}` : ""}
                          {paciente.sexo_nombre ? ` · ${paciente.sexo_nombre}` : ""}
                          {paciente.color ? ` · ${paciente.color}` : ""}
                          {paciente.chip ? ` · Chip: ${paciente.chip}` : ""}
                        </p>

                        {paciente.observaciones && (
                          <p className="mt-2 text-sm text-slate-700">
                            {paciente.observaciones}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link href={`/pacientes/${paciente.uuid}`} className="btn-primary text-sm">
                          Ver ficha
                        </Link>

                        <Link href={`/fichas/nueva?paciente=${paciente.uuid}`} className="btn-secondary text-sm">
                          Nueva ficha
                        </Link>

                        <Link href={`/vacunas/nueva?paciente=${paciente.uuid}`} className="btn-secondary text-sm">
                          Vacuna
                        </Link>

                        <Link href={`/tratamientos/nuevo?paciente=${paciente.uuid}`} className="btn-secondary text-sm">
                          Tratamiento
                        </Link>

                        <button
                          onClick={() => iniciarEdicionPaciente(paciente)}
                          className="btn-secondary text-sm"
                        >
                          Editar mascota
                        </button>

                        <button
                          onClick={() => {
                            setPacienteAEliminar(paciente.uuid);
                            setConfirmPacienteOpen(true);
                          }}
                          className="btn-danger text-sm"
                        >
                          Eliminar mascota
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmPacienteOpen}
        title="Eliminar mascota"
        message="¿Estás seguro? Esta acción eliminará la mascota del sistema."
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={eliminarPaciente}
        onCancel={() => {
          setConfirmPacienteOpen(false);
          setPacienteAEliminar(null);
        }}
      />

      <ConfirmDialog
        open={confirmTutorOpen}
        title="Eliminar tutor"
        message="¿Estás seguro? Esta acción eliminará el tutor del sistema."
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={eliminarTutor}
        onCancel={() => setConfirmTutorOpen(false)}
      />
    </main>
  );
}