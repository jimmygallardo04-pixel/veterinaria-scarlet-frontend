"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";
import { formatEdad } from "@/lib/utils";

type Paciente = {
  id: number;
  nombre: string;
  tutor_nombre: string;
  especie_nombre?: string;
  raza?: string | null;
  fecha_nacimiento?: string | null;
  edad?: number | null;
  color?: string | null;
  esterilizado?: boolean;
};

type FichaForm = {
  paciente: string;
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

// Función auxiliar para obtener fecha/hora actual en formato datetime-local
const obtenerFechaHoraLocal = () => {
  const ahora = new Date();
  // Restar offset de timezone para obtener hora local
  const offsetMs = ahora.getTimezoneOffset() * 60000;
  const fechaLocal = new Date(ahora.getTime() - offsetMs);
  // Formato: YYYY-MM-DDTHH:mm
  return fechaLocal.toISOString().slice(0, 16);
};

const formInicial: FichaForm = {
  paciente: "",
  fecha: obtenerFechaHoraLocal(),
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

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function NuevaFichaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteParam = searchParams.get("paciente");
  const citaParam = searchParams.get("cita");

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<FichaForm>({
    ...formInicial,
    paciente: pacienteParam || "",
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    apiFetch("/pacientes/?page_size=200").then(async (res) => {
      if (res.ok) { const d = await res.json(); setPacientes(d.results ?? d); }
      else toast.error("No se pudieron cargar los pacientes");
    }).catch(() => toast.error("Error de conexión"));
  }, []);

  const f = (key: keyof FichaForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  const crearFicha = async () => {
    if (!form.paciente || !form.motivo_consulta) {
      toast.warning("Selecciona un paciente e ingresa el motivo de consulta");
      return;
    }

    try {
      setGuardando(true);

      // Convertir fecha local a ISO 8601 UTC para el backend
      const fechaISO = new Date(form.fecha).toISOString();

      const res = await apiFetch("/fichas/", {
        method: "POST",
        body: JSON.stringify({
          paciente: Number(form.paciente),
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

      if (!res.ok) { toast.error("No se pudo crear la ficha clínica"); return; }

      const data = await res.json();

      if (citaParam) {
        await apiFetch(`/citas/${citaParam}/`, {
          method: "PATCH",
          body: JSON.stringify({ estado: "completada" }),
        });
        toast.success("Ficha creada y cita marcada como completada");
      } else {
        toast.success("Ficha clínica creada correctamente");
      }

      router.push(`/fichas/${data.id}`);
    } catch {
      toast.error("Error creando ficha clínica");
    } finally {
      setGuardando(false);
    }
  };

  const pacienteSeleccionado = pacientes.find((p) => String(p.id) === form.paciente);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        <div>
          <BackButton href="/fichas" label="Volver a fichas" />
          <h1 className="title mt-2">Nueva ficha clínica</h1>
          <p className="text-muted">Registra una nueva atención médica.</p>
        </div>

        {/* ── Paciente ─────────────────────────────────────────────────── */}
        <section className="card">
          <h2 className="subtitle mb-4">Paciente</h2>

          <select
            className="input w-full"
            value={form.paciente}
            onChange={(e) => {
              const nuevoPacienteId = e.target.value;
              setForm({ ...form, paciente: nuevoPacienteId });
              
              // Actualizar la URL con el nuevo paciente
              if (nuevoPacienteId) {
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('paciente', nuevoPacienteId);
                if (citaParam) {
                  newUrl.searchParams.set('cita', citaParam);
                }
                window.history.replaceState({}, '', newUrl.toString());
              } else {
                // Si no hay paciente seleccionado, remover el parámetro
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('paciente');
                if (citaParam) {
                  newUrl.searchParams.set('cita', citaParam);
                }
                window.history.replaceState({}, '', newUrl.toString());
              }
            }}
          >
            <option value="">Seleccionar paciente *</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} · {p.especie_nombre ?? "Sin especie"} · Tutor: {p.tutor_nombre}
              </option>
            ))}
          </select>

          {pacienteSeleccionado && (
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm md:grid-cols-4">
              <div><p className="text-muted text-xs">Especie</p><p className="font-medium">{pacienteSeleccionado.especie_nombre ?? "-"}</p></div>
              <div><p className="text-muted text-xs">Raza</p><p className="font-medium">{pacienteSeleccionado.raza ?? "-"}</p></div>
              <div><p className="text-muted text-xs">Edad</p><p className="font-medium">{formatEdad(pacienteSeleccionado.fecha_nacimiento)}</p></div>
              <div><p className="text-muted text-xs">Esterilizado</p><p className="font-medium">{pacienteSeleccionado.esterilizado ? "Sí" : "No"}</p></div>
            </div>
          )}
        </section>

        {/* ── Signos vitales ────────────────────────────────────────────── */}
        <section className="card">
          <h2 className="subtitle mb-4">Signos vitales</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Campo label="Peso (kg)">
              <input className="input" type="number" step="0.01" min="0" placeholder="Ej: 4.5" {...f("peso_kg")} />
            </Campo>
            <Campo label="Temperatura (°C)">
              <input className="input" type="number" step="0.1" min="30" max="45" placeholder="Ej: 38.5" {...f("temperatura")} />
            </Campo>
            <Campo label="Frec. cardíaca (lpm)">
              <input className="input" type="number" min="0" placeholder="Ej: 80" {...f("frecuencia_cardiaca")} />
            </Campo>
            <Campo label="Frec. respiratoria (rpm)">
              <input className="input" type="number" min="0" placeholder="Ej: 20" {...f("frecuencia_respiratoria")} />
            </Campo>
          </div>
        </section>

        {/* ── Consulta ──────────────────────────────────────────────────── */}
        <section className="card space-y-4">
          <h2 className="subtitle">Consulta</h2>

          <Campo label="Fecha y hora de consulta *">
            <input
              className="input"
              type="datetime-local"
              {...f("fecha")}
            />
          </Campo>

          <Campo label="Motivo de consulta *">
            <input className="input" placeholder="¿Por qué consulta hoy?" {...f("motivo_consulta")} />
          </Campo>

          <Campo label="Anamnesis">
            <textarea className="input" rows={3} placeholder="Historia clínica, síntomas previos, evolución..." {...f("anamnesis")} />
          </Campo>

          <Campo label="Diagnóstico">
            <textarea className="input" rows={3} placeholder="Diagnóstico presuntivo o definitivo..." {...f("diagnostico")} />
          </Campo>

          <Campo label="Tratamiento">
            <textarea className="input" rows={3} placeholder="Medicamentos, procedimientos indicados..." {...f("tratamiento")} />
          </Campo>

          <Campo label="Indicaciones para el tutor">
            <textarea className="input" rows={2} placeholder="Cuidados en casa, restricciones, dieta..." {...f("indicaciones")} />
          </Campo>

          <Campo label="Observaciones">
            <textarea className="input" rows={2} placeholder="Notas adicionales..." {...f("observaciones")} />
          </Campo>
        </section>

        {/* ── Acciones ──────────────────────────────────────────────────── */}
        <div className="flex gap-3 pb-8">
          <button onClick={crearFicha} disabled={guardando} className="btn-primary">
            {guardando ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : "Guardar ficha"}
          </button>
          <button onClick={() => router.back()} className="btn-secondary">
            Cancelar
          </button>
        </div>

      </div>
    </main>
  );
}
