"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";

type Paciente = { id: number; uuid: string; nombre: string; tutor_nombre: string };

const formInicial = {
  paciente: "",
  nombre_vacuna: "",
  fecha_aplicacion: "",
  proxima_dosis: "",
  observaciones: "",
};

export default function NuevaVacunaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pacienteParam = searchParams.get("paciente");
  const fichaParam = searchParams.get("ficha");

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState({
    ...formInicial,
    paciente: pacienteParam || "",
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    apiFetch("/pacientes/?page_size=200").then(async (res) => {
      if (res.ok) {
        const d = await res.json();
        setPacientes(d.results ?? d);
      }
    });
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      paciente: pacienteParam || "",
    }));
  }, [pacienteParam]);

  const cambiarPaciente = (uuid: string) => {
    setForm((prev) => ({
      ...prev,
      paciente: uuid,
    }));

    if (uuid) {
      router.replace(
        `/vacunas/nueva?paciente=${uuid}${fichaParam ? `&ficha=${fichaParam}` : ""}`
      );
    } else {
      router.replace(fichaParam ? `/vacunas/nueva?ficha=${fichaParam}` : "/vacunas/nueva");
    }
  };

  const guardarVacuna = async () => {
    if (!form.paciente || !form.nombre_vacuna || !form.fecha_aplicacion) {
      toast.warning("Completa paciente, vacuna y fecha");
      return;
    }

    try {
      setGuardando(true);

      const res = await apiFetch("/vacunas/", {
        method: "POST",
        body: JSON.stringify({
          paciente: pacienteSeleccionado?.id,
          nombre_vacuna: form.nombre_vacuna,
          fecha_aplicacion: form.fecha_aplicacion,
          proxima_dosis: form.proxima_dosis || null,
          observaciones: form.observaciones || null,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo registrar la vacuna");
        return;
      }

      toast.success("Vacuna registrada correctamente");

      if (fichaParam) {
        router.push(`/fichas/${fichaParam}`);
      } else if (pacienteParam) {
        router.push(`/pacientes/${pacienteParam}`);
      } else {
        router.push("/pacientes");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const pacienteSeleccionado = pacientes.find((p) => p.uuid === form.paciente);
  const backHref = fichaParam
    ? `/fichas/${fichaParam}`
    : pacienteParam
    ? `/pacientes/${pacienteParam}`
    : "/pacientes";

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <BackButton href={backHref} />
          <h1 className="title mt-2">Registrar vacuna</h1>
          <p className="text-muted">Agrega una vacuna al historial del paciente.</p>
        </div>

        <section className="card">
          <h2 className="subtitle mb-4">Paciente</h2>

          <select
            className="input w-full"
            value={form.paciente}
            onChange={(e) => cambiarPaciente(e.target.value)}
          >
            <option value="">Seleccionar paciente *</option>
            {pacientes.map((p) => (
              <option key={p.uuid} value={p.uuid}>
                {p.nombre} · Tutor: {p.tutor_nombre}
              </option>
            ))}
          </select>

          {pacienteSeleccionado && (
            <p className="text-muted mt-2">
              <strong>{pacienteSeleccionado.nombre}</strong> ·{" "}
              {pacienteSeleccionado.tutor_nombre}
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="subtitle mb-4">Vacuna</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="input md:col-span-2"
              placeholder="Nombre vacuna *"
              value={form.nombre_vacuna}
              onChange={(e) =>
                setForm({ ...form, nombre_vacuna: e.target.value })
              }
            />

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Fecha de aplicación *
              </label>
              <input
                type="date"
                className="input"
                value={form.fecha_aplicacion}
                onChange={(e) =>
                  setForm({ ...form, fecha_aplicacion: e.target.value })
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
                value={form.proxima_dosis}
                onChange={(e) =>
                  setForm({ ...form, proxima_dosis: e.target.value })
                }
              />
            </div>

            <textarea
              className="input md:col-span-2"
              placeholder="Observaciones"
              rows={3}
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={guardarVacuna}
              disabled={guardando}
              className="btn-primary"
            >
              {guardando ? "Guardando..." : "Guardar vacuna"}
            </button>

            <button onClick={() => router.push(backHref)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}