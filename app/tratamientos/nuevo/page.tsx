"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type Paciente = {
  id: number;
  nombre: string;
  tutor_nombre: string;
};

type FormTratamiento = {
  paciente: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin: string;
  indicaciones: string;
};

const formInicial: FormTratamiento = {
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const pacienteParam = searchParams.get("paciente");
  const fichaParam = searchParams.get("ficha");

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<FormTratamiento>({
    ...formInicial,
    paciente: pacienteParam || "",
  });
  const [guardando, setGuardando] = useState(false);

  const getToken = () => sessionStorage.getItem("access");

  const cargarPacientes = async () => {
    try {
      const res = await fetch(`${apiUrl}/pacientes/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        toast.error("Error cargando pacientes");
        return;
      }

      const data = await res.json();
      setPacientes(data);
    } catch (error) {
      console.log(error);
      toast.error("Error cargando pacientes");
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, []);

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

      const res = await fetch(`${apiUrl}/tratamientos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          paciente: Number(form.paciente),
          medicamento: form.medicamento,
          dosis: form.dosis,
          frecuencia: form.frecuencia,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin || null,
          indicaciones: form.indicaciones || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.log(error);
        toast.error("No se pudo registrar el tratamiento");
        return;
      }

      toast.success("Tratamiento registrado correctamente");

      if (fichaParam) {
        router.push(`/fichas/${fichaParam}`);
      } else {
        router.push("/fichas");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error registrando tratamiento");
    } finally {
      setGuardando(false);
    }
  };

  const pacienteSeleccionado = pacientes.find(
    (p) => String(p.id) === form.paciente
  );

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="title">Registrar tratamiento</h1>
          <p className="text-muted">
            Agrega un tratamiento al historial del paciente.
          </p>
        </div>

        <section className="card">
          <h2 className="subtitle mb-4">Paciente</h2>

          <select
            className="input w-full"
            value={form.paciente}
            onChange={(e) => setForm({ ...form, paciente: e.target.value })}
          >
            <option value="">Seleccionar paciente *</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} · Tutor: {p.tutor_nombre}
              </option>
            ))}
          </select>

          {pacienteSeleccionado && (
            <p className="mt-3 text-sm text-muted">
              <strong>{pacienteSeleccionado.nombre}</strong> ·{" "}
              {pacienteSeleccionado.tutor_nombre}
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="subtitle mb-4">Tratamiento</h2>

          <input
            className="input mb-3"
            placeholder="Medicamento *"
            value={form.medicamento}
            onChange={(e) =>
              setForm({ ...form, medicamento: e.target.value })
            }
          />

          <input
            className="input mb-3"
            placeholder="Dosis *"
            value={form.dosis}
            onChange={(e) => setForm({ ...form, dosis: e.target.value })}
          />

          <input
            className="input mb-3"
            placeholder="Frecuencia * Ej: cada 12 horas"
            value={form.frecuencia}
            onChange={(e) =>
              setForm({ ...form, frecuencia: e.target.value })
            }
          />

          <input
            className="input mb-3"
            type="date"
            value={form.fecha_inicio}
            onChange={(e) =>
              setForm({ ...form, fecha_inicio: e.target.value })
            }
          />

          <input
            className="input mb-3"
            type="date"
            value={form.fecha_fin}
            onChange={(e) =>
              setForm({ ...form, fecha_fin: e.target.value })
            }
          />

          <textarea
            className="input"
            placeholder="Indicaciones"
            value={form.indicaciones}
            onChange={(e) =>
              setForm({ ...form, indicaciones: e.target.value })
            }
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={guardarTratamiento}
              disabled={guardando}
              className="btn-primary"
            >
              {guardando ? "Guardando..." : "Guardar tratamiento"}
            </button>

            <button
              onClick={() =>
                fichaParam ? router.push(`/fichas/${fichaParam}`) : router.back()
              }
              className="rounded-lg border px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}