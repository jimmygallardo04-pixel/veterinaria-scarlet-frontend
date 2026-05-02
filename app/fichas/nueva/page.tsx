"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type Paciente = {
  id: number;
  nombre: string;
  tutor_nombre: string;
  especie_nombre?: string;
};

type FichaForm = {
  paciente: string;
  motivo_consulta: string;
  anamnesis: string;
  peso_kg: string;
  temperatura: string;
  frecuencia_cardiaca: string;
  frecuencia_respiratoria: string;
  diagnostico: string;
  tratamiento: string;
  indicaciones: string;
  observaciones: string;
};

const formInicial: FichaForm = {
  paciente: "",
  motivo_consulta: "",
  anamnesis: "",
  peso_kg: "",
  temperatura: "",
  frecuencia_cardiaca: "",
  frecuencia_respiratoria: "",
  diagnostico: "",
  tratamiento: "",
  indicaciones: "",
  observaciones: "",
};

export default function NuevaFichaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const pacienteParam = searchParams.get("paciente");
  const citaParam = searchParams.get("cita"); // 🔥 NUEVO

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<FichaForm>({
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
        toast.error("No se pudieron cargar los pacientes");
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

  const crearFicha = async () => {
    if (!form.paciente || !form.motivo_consulta) {
      toast.warning("Selecciona un paciente e ingresa el motivo de consulta");
      return;
    }

    try {
      setGuardando(true);

      const res = await fetch(`${apiUrl}/fichas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          paciente: Number(form.paciente),
          motivo_consulta: form.motivo_consulta,
          anamnesis: form.anamnesis || null,
          peso_kg: form.peso_kg || null,
          temperatura: form.temperatura || null,
          frecuencia_cardiaca: form.frecuencia_cardiaca
            ? Number(form.frecuencia_cardiaca)
            : null,
          frecuencia_respiratoria: form.frecuencia_respiratoria
            ? Number(form.frecuencia_respiratoria)
            : null,
          diagnostico: form.diagnostico || null,
          tratamiento: form.tratamiento || null,
          indicaciones: form.indicaciones || null,
          observaciones: form.observaciones || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.log(error);
        toast.error("No se pudo crear la ficha clínica");
        return;
      }

      const data = await res.json();

      // 🔥 NUEVO: completar cita automáticamente
      if (citaParam) {
        await fetch(`${apiUrl}/citas/${citaParam}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            estado: "completada",
          }),
        });
      }

      toast.success("Ficha clínica creada correctamente");

      router.push(`/fichas/${data.id}`);
    } catch (error) {
      console.log(error);
      toast.error("Error creando ficha clínica");
    } finally {
      setGuardando(false);
    }
  };

  const pacienteSeleccionado = pacientes.find(
    (p) => String(p.id) === form.paciente
  );

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="title">Nueva ficha clínica</h1>
          <p className="text-muted">
            Registra una nueva atención médica.
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
          <h2 className="subtitle mb-4">Consulta</h2>

          <input
            className="input mb-3"
            placeholder="Motivo de consulta *"
            value={form.motivo_consulta}
            onChange={(e) =>
              setForm({ ...form, motivo_consulta: e.target.value })
            }
          />

          <textarea
            className="input mb-3"
            placeholder="Diagnóstico"
            value={form.diagnostico}
            onChange={(e) =>
              setForm({ ...form, diagnostico: e.target.value })
            }
          />

          <textarea
            className="input mb-3"
            placeholder="Tratamiento"
            value={form.tratamiento}
            onChange={(e) =>
              setForm({ ...form, tratamiento: e.target.value })
            }
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={crearFicha}
              disabled={guardando}
              className="btn-primary"
            >
              {guardando ? "Guardando..." : "Guardar ficha"}
            </button>

            <button
              onClick={() => router.back()}
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