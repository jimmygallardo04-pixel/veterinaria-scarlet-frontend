"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";

type FichaForm = {
  fecha: string;
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
  fecha: "",
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
  const fichaId = params.uuid as string;

  const [form, setForm] = useState<FichaForm>(formInicial);
  const [pacienteNombre, setPacienteNombre] = useState("");
  const [pacienteTutor, setPacienteTutor] = useState("");
  const [pacienteEspecie, setPacienteEspecie] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarFicha = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/fichas/${fichaId}/`);
        if (!res.ok) { toast.error("No se pudo cargar la ficha"); return; }

        const data = await res.json();

        // Datos del paciente (solo lectura)
        setPacienteNombre(data.paciente_nombre || data.paciente?.nombre || "");
        setPacienteTutor(data.tutor_nombre || "");
        setPacienteEspecie(data.especie_nombre || "");

        // Convertir fecha UTC a datetime-local
        let fechaLocal = "";
        if (data.fecha) {
          const fechaUTC = new Date(data.fecha);
          const offsetMs = fechaUTC.getTimezoneOffset() * 60000;
          fechaLocal = new Date(fechaUTC.getTime() - offsetMs).toISOString().slice(0, 16);
        }

        setForm({
          fecha: fechaLocal,
          motivo_consulta: data.motivo_consulta || "",
          anamnesis: data.anamnesis || "",
          peso_kg: data.peso_kg || "",
          temperatura: data.temperatura || "",
          frecuencia_cardiaca: data.frecuencia_cardiaca ? String(data.frecuencia_cardiaca) : "",
          frecuencia_respiratoria: data.frecuencia_respiratoria ? String(data.frecuencia_respiratoria) : "",
          diagnostico: data.diagnostico || "",
          tratamiento: data.tratamiento || "",
          indicaciones: data.indicaciones || "",
          observaciones: data.observaciones || "",
        });
      } catch {
        toast.error("Error cargando ficha");
      } finally {
        setLoading(false);
      }
    };

    cargarFicha();
  }, [fichaId]);

  const guardarCambios = async () => {
    if (!form.motivo_consulta) {
      toast.warning("El motivo de consulta es obligatorio");
      return;
    }

    try {
      setGuardando(true);
      const fechaISO = form.fecha ? new Date(form.fecha).toISOString() : null;

      const res = await apiFetch(`/fichas/${fichaId}/`, {
        method: "PATCH",
        body: JSON.stringify({
          fecha: fechaISO,
          motivo_consulta: form.motivo_consulta,
          anamnesis: form.anamnesis || null,
          peso_kg: form.peso_kg || null,
          temperatura: form.temperatura || null,
          frecuencia_cardiaca: form.frecuencia_cardiaca ? Number(form.frecuencia_cardiaca) : null,
          frecuencia_respiratoria: form.frecuencia_respiratoria ? Number(form.frecuencia_respiratoria) : null,
          diagnostico: form.diagnostico || null,
          tratamiento: form.tratamiento || null,
          indicaciones: form.indicaciones || null,
          observaciones: form.observaciones || null,
        }),
      });

      if (!res.ok) { toast.error("No se pudo actualizar la ficha"); return; }

      toast.success("Ficha clínica actualizada");
      router.push(`/fichas/${fichaId}`);
    } catch {
      toast.error("Error actualizando ficha");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="card mx-auto max-w-4xl">
          <div className="skeleton h-5 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <BackButton href={`/fichas/${fichaId}`} label="Volver a la ficha" />
          <h1 className="title mt-2">Editar ficha clínica</h1>
          <p className="text-muted">Actualiza la información médica registrada.</p>
        </div>

        {/* Paciente — solo lectura, no se puede cambiar */}
        <section className="card">
          <h2 className="subtitle mb-3">Paciente</h2>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-900">{pacienteNombre}</p>
            <p className="text-muted">
              {pacienteEspecie}{pacienteEspecie && pacienteTutor ? " · " : ""}
              {pacienteTutor ? `Tutor: ${pacienteTutor}` : ""}
            </p>
          </div>
        </section>

        <section className="card">
          <h2 className="subtitle mb-4">Consulta</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Fecha y hora de consulta *</label>
              <input
                className="input w-full"
                type="datetime-local"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>

            <input
              className="input md:col-span-2"
              placeholder="Motivo de consulta *"
              value={form.motivo_consulta}
              onChange={(e) => setForm({ ...form, motivo_consulta: e.target.value })}
            />

            <textarea
              className="input md:col-span-2"
              placeholder="Anamnesis"
              rows={3}
              value={form.anamnesis}
              onChange={(e) => setForm({ ...form, anamnesis: e.target.value })}
            />

            <div>
              <label className="block text-xs text-slate-500 mb-1">Peso (kg)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="Ej: 4.5"
                value={form.peso_kg}
                onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Temperatura (°C)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                placeholder="Ej: 38.5"
                value={form.temperatura}
                onChange={(e) => setForm({ ...form, temperatura: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Frecuencia cardíaca (lpm)</label>
              <input
                className="input"
                type="number"
                placeholder="Ej: 80"
                value={form.frecuencia_cardiaca}
                onChange={(e) => setForm({ ...form, frecuencia_cardiaca: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Frecuencia respiratoria (rpm)</label>
              <input
                className="input"
                type="number"
                placeholder="Ej: 20"
                value={form.frecuencia_respiratoria}
                onChange={(e) => setForm({ ...form, frecuencia_respiratoria: e.target.value })}
              />
            </div>

            <textarea
              className="input md:col-span-2"
              placeholder="Diagnóstico"
              rows={3}
              value={form.diagnostico}
              onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
            />

            <textarea
              className="input md:col-span-2"
              placeholder="Tratamiento"
              rows={3}
              value={form.tratamiento}
              onChange={(e) => setForm({ ...form, tratamiento: e.target.value })}
            />

            <textarea
              className="input md:col-span-2"
              placeholder="Indicaciones para el tutor"
              rows={2}
              value={form.indicaciones}
              onChange={(e) => setForm({ ...form, indicaciones: e.target.value })}
            />

            <textarea
              className="input md:col-span-2"
              placeholder="Observaciones"
              rows={2}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </div>

          <div className="mt-5 flex gap-2">
            <button onClick={guardarCambios} disabled={guardando} className="btn-primary">
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
            <button onClick={() => router.push(`/fichas/${fichaId}`)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
