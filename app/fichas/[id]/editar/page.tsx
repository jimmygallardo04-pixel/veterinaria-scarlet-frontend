"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditarFichaPage() {
  const params = useParams();
  const router = useRouter();

  const fichaId = params.id as string;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<FichaForm>(formInicial);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const getToken = () => sessionStorage.getItem("access");

  const cargarPacientes = async () => {
    const res = await fetch(`${apiUrl}/pacientes/`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!res.ok) return;

    const data = await res.json();
    setPacientes(data);
  };

  const cargarFicha = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${apiUrl}/fichas/${fichaId}/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        toast.error("No se pudo cargar la ficha");
        return;
      }

      const data = await res.json();

      setForm({
        paciente: String(data.paciente?.id ?? data.paciente ?? ""),
        motivo_consulta: data.motivo_consulta || "",
        anamnesis: data.anamnesis || "",
        peso_kg: data.peso_kg || "",
        temperatura: data.temperatura || "",
        frecuencia_cardiaca: data.frecuencia_cardiaca
          ? String(data.frecuencia_cardiaca)
          : "",
        frecuencia_respiratoria: data.frecuencia_respiratoria
          ? String(data.frecuencia_respiratoria)
          : "",
        diagnostico: data.diagnostico || "",
        tratamiento: data.tratamiento || "",
        indicaciones: data.indicaciones || "",
        observaciones: data.observaciones || "",
      });
    } catch (error) {
      console.log(error);
      toast.error("Error cargando ficha");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([cargarPacientes(), cargarFicha()]);
  }, [fichaId]);

  const guardarCambios = async () => {
    if (!form.paciente || !form.motivo_consulta) {
      toast.warning("Selecciona un paciente e ingresa el motivo de consulta");
      return;
    }

    try {
      setGuardando(true);

      const res = await fetch(`${apiUrl}/fichas/${fichaId}/`, {
        method: "PATCH",
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
        toast.error("No se pudo actualizar la ficha");
        return;
      }

      toast.success("Ficha clínica actualizada");
      router.push(`/fichas/${fichaId}`);
    } catch (error) {
      console.log(error);
      toast.error("Error actualizando ficha");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="card mx-auto max-w-4xl">
          <p className="text-muted">Cargando ficha...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="title">Editar ficha clínica</h1>
          <p className="text-muted">
            Actualiza la información médica registrada.
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
                {p.especie_nombre ? ` · ${p.especie_nombre}` : ""}
              </option>
            ))}
          </select>
        </section>

        <section className="card">
          <h2 className="subtitle mb-4">Consulta</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="input md:col-span-2"
              placeholder="Motivo de consulta *"
              value={form.motivo_consulta}
              onChange={(e) =>
                setForm({ ...form, motivo_consulta: e.target.value })
              }
            />

            <textarea
              className="input md:col-span-2"
              placeholder="Anamnesis"
              value={form.anamnesis}
              onChange={(e) => setForm({ ...form, anamnesis: e.target.value })}
            />

            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Peso kg"
              value={form.peso_kg}
              onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
            />

            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Temperatura °C"
              value={form.temperatura}
              onChange={(e) =>
                setForm({ ...form, temperatura: e.target.value })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Frecuencia cardíaca"
              value={form.frecuencia_cardiaca}
              onChange={(e) =>
                setForm({ ...form, frecuencia_cardiaca: e.target.value })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Frecuencia respiratoria"
              value={form.frecuencia_respiratoria}
              onChange={(e) =>
                setForm({ ...form, frecuencia_respiratoria: e.target.value })
              }
            />

            <textarea
              className="input md:col-span-2"
              placeholder="Diagnóstico"
              value={form.diagnostico}
              onChange={(e) =>
                setForm({ ...form, diagnostico: e.target.value })
              }
            />

            <textarea
              className="input md:col-span-2"
              placeholder="Tratamiento"
              value={form.tratamiento}
              onChange={(e) =>
                setForm({ ...form, tratamiento: e.target.value })
              }
            />

            <textarea
              className="input md:col-span-2"
              placeholder="Indicaciones"
              value={form.indicaciones}
              onChange={(e) =>
                setForm({ ...form, indicaciones: e.target.value })
              }
            />

            <textarea
              className="input md:col-span-2"
              placeholder="Observaciones"
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
            />
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={guardarCambios}
              disabled={guardando}
              className="btn-primary disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>

            <button
              onClick={() => router.push(`/fichas/${fichaId}`)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}