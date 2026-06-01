"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";
import SearchableSelect, { type SearchableOption } from "@/app/components/SearchableSelect";

type Paciente = {
  id: number;
  uuid: string;
  nombre: string;
  tutor: number;
  tutor_nombre: string;
  especie_nombre?: string;
};

export default function NuevaCitaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteParam = searchParams.get("paciente");

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    paciente: pacienteParam || "",
    fecha_hora: dayjs().add(1, "day").format("YYYY-MM-DDTHH:mm"),
    motivo: "",
    observaciones: "",
    estado: "pendiente",
  });

  useEffect(() => {
    apiFetch("/pacientes/?page_size=200").then(async (res) => {
      if (res.ok) { const d = await res.json(); setPacientes(d.results ?? d); }
    });
  }, []);

  const guardarCita = async () => {
    if (!form.paciente || !form.fecha_hora || !form.motivo) {
      toast.warning("Completa paciente, fecha y motivo");
      return;
    }

    // form.paciente puede ser un uuid (desde URL) o un id numérico (desde el select)
    const pacienteSeleccionado = pacientes.find(
      (p) => String(p.id) === form.paciente || p.uuid === form.paciente
    );
    if (!pacienteSeleccionado) { toast.error("Paciente no válido"); return; }

    try {
      setGuardando(true);

      const res = await apiFetch("/citas/", {
        method: "POST",
        body: JSON.stringify({
          paciente: pacienteSeleccionado.id,
          tutor: pacienteSeleccionado.tutor,
          fecha_hora: dayjs(form.fecha_hora).format("YYYY-MM-DDTHH:mm:ss"),
          motivo: form.motivo,
          observaciones: form.observaciones || null,
          estado: form.estado,
        }),
      });

      if (!res.ok) { toast.error("No se pudo crear la cita"); return; }

      toast.success("Cita agendada correctamente");
      router.push("/citas");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // Convertir pacientes a formato SearchableOption — usar id numérico como identificador
  const pacientesOptions: SearchableOption[] = useMemo(() => 
    pacientes.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: `${p.especie_nombre ?? "Sin especie"} · Tutor: ${p.tutor_nombre}`,
    })),
    [pacientes]
  );

  // Normalizar form.paciente: si viene como UUID desde la URL, convertir al id numérico
  const pacienteIdNormalizado = useMemo(() => {
    if (!form.paciente) return "";
    // Si ya es numérico, usarlo directo
    if (/^\d+$/.test(form.paciente)) return form.paciente;
    // Si es UUID, buscar el paciente y devolver su id
    const p = pacientes.find((p) => p.uuid === form.paciente);
    return p ? String(p.id) : form.paciente;
  }, [form.paciente, pacientes]);

  const pacienteSeleccionado = pacientes.find(
    (p) => String(p.id) === pacienteIdNormalizado || p.uuid === form.paciente
  );

  const backHref = "/citas";

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-2xl space-y-6">

        <div>
          <BackButton href="/citas" label="Volver a citas" />
          <h1 className="title mt-2">Nueva cita</h1>
          <p className="text-muted">Agenda una visita para un paciente.</p>
        </div>

        <section className="card space-y-4">

          {/* Paciente */}
          <div>
          <SearchableSelect
            options={pacientesOptions}
            value={pacienteIdNormalizado}
            onChange={(value) => {
              setForm({ ...form, paciente: value });

              // Actualizar la URL con el uuid del paciente seleccionado
              const newUrl = new URL(window.location.href);
              if (value) {
                const paciente = pacientes.find((p) => String(p.id) === value);
                if (paciente) {
                  newUrl.searchParams.set('paciente', paciente.uuid);
                }
              } else {
                newUrl.searchParams.delete('paciente');
              }
              window.history.replaceState({}, '', newUrl.toString());
            }}
            placeholder="Buscar paciente por nombre o tutor..."
            emptyMessage="No se encontraron pacientes"
            label="Paciente *"
            required
            searchFields={["nombre", "descripcion"]}
            renderOption={(option) => (
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{option.nombre}</span>
                <span className="text-sm text-slate-500">
                  {option.descripcion}
                </span>
              </div>
            )}
          />

            {pacienteSeleccionado && (
              <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
                <p className="text-muted">
                  Tutor: <strong className="text-slate-900">{pacienteSeleccionado.tutor_nombre}</strong>
                </p>
                {pacienteSeleccionado.especie_nombre && (
                  <p className="text-muted">
                    Especie: <strong className="text-slate-900">{pacienteSeleccionado.especie_nombre}</strong>
                    </p>
                )}
              </div>
            )}
          </div>

          {/* Fecha y hora */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Fecha y hora *</label>
            <input
              type="datetime-local"
              className="input w-full"
              value={form.fecha_hora}
              onChange={(e) => setForm({ ...form, fecha_hora: e.target.value })}
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Motivo *</label>
            <input
              className="input w-full"
              placeholder="Ej: Control anual, vacunación, revisión..."
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Observaciones</label>
            <textarea
              className="input w-full"
              rows={3}
              placeholder="Notas adicionales para la cita..."
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
            <select
              className="input w-full"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button onClick={guardarCita} disabled={guardando} className="btn-primary">
              {guardando ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : "Agendar cita"}
            </button>
            <button onClick={() => router.back()} className="btn-secondary">
              Cancelar
            </button>
          </div>

        </section>
      </div>
    </main>
  );
}
