"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";
import PageSkeleton from "@/app/components/PageSkeleton";
import type { Tutor, Paciente } from "@/lib/types";

// ── Tipos ────────────────────────────────────────────────────────────────────────

type PacienteConTutor = Paciente & {
  especie_nombre?: string | null;
  sexo_nombre?: string | null;
};

// ── Componente principal ──────────────────────────────────────────────────────────

export default function DetalleTutorPage() {
  const params = useParams();
  const router = useRouter();
  const tutorUuid = params.uuid as string;

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [pacientes, setPacientes] = useState<PacienteConTutor[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Carga de datos ──────────────────────────────────────────────────────────

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
    cargarDatos();
  }, [tutorUuid]);

  // ── Render ──────────────────────────────────────────────────────────────────

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
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="page-header">
          <div>
            <BackButton href="/tutores" label="Volver a tutores" />
            <h1 className="title mt-2">
              {tutor.nombre}
            </h1>
            <p className="text-muted">
              {tutor.telefono}
              {tutor.rut ? ` · ${tutor.rut}` : ""}
              {tutor.email ? ` · ${tutor.email}` : ""}
              {!tutor.activo && (
                <span className="ml-2 badge-red">Inactivo</span>
              )}
            </p>
          </div>
          <Link href="/tutores" className="btn-secondary">
            Editar tutor
          </Link>
        </div>

        {/* Ficha del tutor */}
        <section className="card">
          <h2 className="subtitle mb-4">Datos del tutor</h2>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
            <div><p className="text-muted text-xs">Nombre</p><p className="font-medium">{tutor.nombre}</p></div>
            <div><p className="text-muted text-xs">RUT</p><p className="font-medium">{tutor.rut ?? "-"}</p></div>
            <div><p className="text-muted text-xs">Teléfono</p><p className="font-medium">{tutor.telefono}</p></div>
            <div><p className="text-muted text-xs">Email</p><p className="font-medium">{tutor.email ?? "-"}</p></div>
            <div className="col-span-2 sm:col-span-3 lg:col-span-2"><p className="text-muted text-xs">Dirección</p><p className="font-medium">{tutor.direccion ?? "-"}</p></div>
            <div><p className="text-muted text-xs">Estado</p><p className="font-medium">{tutor.activo ? "Activo" : "Inactivo"}</p></div>
          </div>
        </section>

        {/* Pacientes */}
        <section className="card">
          <h2 className="subtitle mb-4">
            Pacientes ({pacientes.length})
          </h2>

          {pacientes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted">Este tutor no tiene pacientes registrados.</p>
              <Link href={`/pacientes/nuevo?tutor=${tutorUuid}`} className="btn-primary mt-4">
                + Registrar primer paciente
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pacientes.map((paciente) => (
                <Link
                  key={paciente.uuid}
                  href={`/pacientes/${paciente.uuid}`}
                  className="p-4 border border-slate-200 rounded-lg hover:shadow-md hover:border-green-300 transition-all bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{paciente.nombre}</p>
                      <p className="text-muted text-sm mt-1">
                        {paciente.especie_nombre ?? "Sin especie"}
                        {paciente.raza ? ` · ${paciente.raza}` : ""}
                      </p>
                      {paciente.sexo_nombre && (
                        <p className="text-muted text-xs mt-0.5">{paciente.sexo_nombre}</p>
                      )}
                    </div>
                    <span className="text-slate-400 shrink-0 ml-2">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Acciones rápidas */}
        {pacientes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/pacientes/nuevo?tutor=${tutorUuid}`} className="btn-primary text-sm">
              + Nuevo paciente
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}