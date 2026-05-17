"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import dayjs from "dayjs";

interface CitaModalProps {
  open: boolean;
  pacienteId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const formInicial = {
  fecha_hora: "",
  motivo: "",
  observaciones: "",
  estado: "pendiente",
};

export default function CitaModal({
  open,
  pacienteId,
  onClose,
  onSuccess,
}: CitaModalProps) {
  const [form, setForm] = useState(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [pacienteTutorId, setPacienteTutorId] = useState<number | null>(null);

  useEffect(() => {
    if (open && pacienteId) {
      // Cargar datos del paciente para obtener el tutor_id
      apiFetch(`/pacientes/${pacienteId}/`).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          // El tutor_id viene en la respuesta del paciente
          if (data.tutor_id) {
            setPacienteTutorId(data.tutor_id);
          }
        }
      });

      const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DDTHH:mm");
      setForm({ ...formInicial, fecha_hora: tomorrow });
    }
  }, [open, pacienteId]);

  const guardarCita = async () => {
    if (!form.fecha_hora || !form.motivo) {
      toast.warning("Completa la fecha/hora y el motivo de la cita");
      return;
    }

    if (!pacienteTutorId) {
      toast.error("Error obteniendo datos del paciente");
      return;
    }

    try {
      setGuardando(true);
      const fechaISO = dayjs(form.fecha_hora).format("YYYY-MM-DDTHH:mm:ss");

      const res = await apiFetch("/citas/", {
        method: "POST",
        body: JSON.stringify({
          paciente: pacienteId,
          tutor: pacienteTutorId,
          fecha_hora: fechaISO,
          motivo: form.motivo,
          observaciones: form.observaciones || null,
          estado: form.estado,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo crear la cita");
        return;
      }

      toast.success("Cita agendada correctamente");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  if (!open || !pacienteId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Agregar Cita</h2>

        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha y hora *</label>
            <input
              type="datetime-local"
              className="input w-full"
              value={form.fecha_hora}
              onChange={(e) => setForm({ ...form, fecha_hora: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Motivo *</label>
            <input
              type="text"
              className="input w-full"
              placeholder="ej: Revisión, Vacunación"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Estado</label>
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

          <div>
            <label className="block text-xs text-slate-500 mb-1">Observaciones</label>
            <textarea
              className="input w-full"
              placeholder="Notas adicionales"
              rows={2}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={guardarCita}
            disabled={guardando}
            className="btn-primary flex-1"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
