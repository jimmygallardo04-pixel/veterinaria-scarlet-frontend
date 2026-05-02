"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Cita = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  tutor_nombre: string;
  fecha_hora: string;
  motivo: string;
  estado: string;
};

export default function CitasPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => sessionStorage.getItem("access");

  const cargarCitas = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${apiUrl}/citas/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        toast.error("Error cargando citas");
        return;
      }

      const data = await res.json();
      setCitas(data);
    } catch (error) {
      console.log(error);
      toast.error("Error cargando citas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  const actualizarEstado = async (id: number, estado: string) => {
    try {
      const res = await fetch(`${apiUrl}/citas/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ estado }),
      });

      if (!res.ok) {
        toast.error("No se pudo actualizar la cita");
        return;
      }

      toast.success("Estado actualizado");
      cargarCitas();
    } catch (error) {
      console.log(error);
      toast.error("Error actualizando cita");
    }
  };

  const eliminarCita = async (id: number) => {
    const confirmar = confirm("¿Eliminar cita?");
    if (!confirmar) return;

    const res = await fetch(`${apiUrl}/citas/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }

    toast.success("Cita eliminada");
    cargarCitas();
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="title">Citas</h1>

          <Link href="/pacientes" className="btn-primary">
            Nueva cita
          </Link>
        </div>

        {loading ? (
          <div className="card">
            <p className="text-muted">Cargando citas...</p>
          </div>
        ) : citas.length === 0 ? (
          <div className="card">
            <p className="text-muted">No hay citas registradas.</p>
          </div>
        ) : (
          <section className="space-y-3">
            {citas.map((cita) => (
              <div key={cita.id} className="card">
                <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">

                  {/* INFO */}
                  <div>
                    <p className="text-sm text-muted">
                      {new Date(cita.fecha_hora).toLocaleString()}
                    </p>

                    <h2 className="font-semibold">
                      {cita.paciente_nombre}
                    </h2>

                    <p className="text-sm text-muted">
                      Tutor: {cita.tutor_nombre}
                    </p>

                    <p className="text-sm mt-1">
                      {cita.motivo}
                    </p>

                    <span className="text-xs mt-1 inline-block">
                      Estado: <strong>{cita.estado}</strong>
                    </span>
                  </div>

                  {/* ACCIONES */}
                  <div className="flex flex-wrap gap-2">

                    {/* VER PACIENTE */}
                    <Link
                      href={`/pacientes/${cita.paciente}`}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      Ver paciente
                    </Link>

                    {/* CREAR FICHA */}
                    <Link
                      href={`/fichas/nueva?paciente=${cita.paciente}&cita=${cita.id}`}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                    >
                      Crear ficha
                    </Link>

                    {/* COMPLETAR */}
                    {cita.estado !== "completada" && (
                      <button
                        onClick={() =>
                          actualizarEstado(cita.id, "completada")
                        }
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        Marcar completada
                      </button>
                    )}

                    {/* CANCELAR */}
                    {cita.estado !== "cancelada" && (
                      <button
                        onClick={() =>
                          actualizarEstado(cita.id, "cancelada")
                        }
                        className="rounded-lg border px-3 py-2 text-sm text-red-600"
                      >
                        Cancelar
                      </button>
                    )}

                    {/* ELIMINAR */}
                    <button
                      onClick={() => eliminarCita(cita.id)}
                      className="btn-danger text-sm"
                    >
                      Eliminar
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}