"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";

type Paciente = { uuid: string; nombre: string; tutor_nombre: string };

const formInicial = {
  paciente: "",
  medicamento: "",
  dosis: "",
  frecuencia: "",
  fecha_inicio: "",
  fecha_fin: "",
  indicaciones: "",
};

export default function NuevoTratamientoPage() {
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
        `/tratamientos/nuevo?paciente=${uuid}${fichaParam ? `&ficha=${fichaParam}` : ""}`
      );
    } else {
      router.replace(
        fichaParam ? `/tratamientos/nuevo?ficha=${fichaParam}` : "/tratamientos/nuevo"
      );
    }
  };

  const guardarTratamiento = async () => {
    if (
      !form.paciente ||
      !form.medicamento ||
      !form.dosis ||
      !form.frecuencia ||
      !form.fecha_inicio
    ) {
      toast.warning("Completa paciente, medicamento, dosis, frecuencia y fecha de inicio");
      return;
    }

    try {
      setGuardando(true);

      const res = await apiFetch("/tratamientos/", {
        method: "POST",
        body: JSON.stringify({
          paciente: form.paciente,
          medicamento: form.medicamento,
          dosis: form.dosis,
          frecuencia: form.frecuencia,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin || null,
          indicaciones: form.indicaciones || null,
          ficha_clinica: fichaParam || null,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo registrar el tratamiento");
        return;
      }

      toast.success("Tratamiento registrado correctamente");
      router.push(fichaParam ? `/fichas/${fichaParam}` : "/fichas");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const pacienteSeleccionado = pacientes.find((p) => p.uuid === form.paciente);
  const backHref = fichaParam ? `/fichas/${fichaParam}` : "/fichas";

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <BackButton href={backHref} />
          <h1 className="title mt-2">Registrar tratamiento</h1>
          <p className="text-muted">Agrega un tratamiento al historial del paciente.</p>
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
          <h2 className="subtitle mb-4">Tratamiento</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="input md:col-span-2"
              placeholder="Medicamento *"
              value={form.medicamento}
              onChange={(e) => setForm({ ...form, medicamento: e.target.value })}
            />

            <input
              className="input"
              placeholder="Dosis * (ej: 5mg)"
              value={form.dosis}
              onChange={(e) => setForm({ ...form, dosis: e.target.value })}
            />

            <input
              className="input"
              placeholder="Frecuencia * (ej: cada 12 horas)"
              value={form.frecuencia}
              onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
            />

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Fecha de inicio *
              </label>
              <input
                type="date"
                className="input"
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha de fin</label>
              <input
                type="date"
                className="input"
                value={form.fecha_fin}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
              />
            </div>

            <textarea
              className="input md:col-span-2"
              placeholder="Indicaciones"
              rows={3}
              value={form.indicaciones}
              onChange={(e) => setForm({ ...form, indicaciones: e.target.value })}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={guardarTratamiento} disabled={guardando} className="btn-primary">
              {guardando ? "Guardando..." : "Guardar tratamiento"}
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