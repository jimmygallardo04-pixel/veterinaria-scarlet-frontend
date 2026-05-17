"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface TratamientoModalProps {
  open: boolean;
  pacienteId: number | null;
  fichaId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const formInicial = {
  medicamento: "",
  dosis: "",
  frecuencia: "",
  fecha_inicio: "",
  fecha_fin: "",
  indicaciones: "",
};

export default function TratamientoModal({
  open,
  pacienteId,
  fichaId,
  onClose,
  onSuccess,
}: TratamientoModalProps) {
  const [form, setForm] = useState(formInicial);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(formInicial);
    }
  }, [open]);

  const guardarTratamiento = async () => {
    if (!form.medicamento || !form.dosis || !form.frecuencia || !form.fecha_inicio) {
      toast.warning("Completa medicamento, dosis, frecuencia y fecha de inicio");
      return;
    }

    try {
      setGuardando(true);
      const res = await apiFetch("/tratamientos/", {
        method: "POST",
        body: JSON.stringify({
          paciente: pacienteId,
          medicamento: form.medicamento,
          dosis: form.dosis,
          frecuencia: form.frecuencia,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin || null,
          indicaciones: form.indicaciones || null,
          ficha_clinica: fichaId,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo registrar el tratamiento");
        return;
      }

      toast.success("Tratamiento registrado correctamente");
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Agregar Tratamiento</h2>

        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Medicamento *</label>
            <input
              type="text"
              className="input w-full"
              placeholder="ej: Amoxicilina"
              value={form.medicamento}
              onChange={(e) => setForm({ ...form, medicamento: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Dosis *</label>
              <input
                type="text"
                className="input w-full"
                placeholder="ej: 5mg"
                value={form.dosis}
                onChange={(e) => setForm({ ...form, dosis: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Frecuencia *</label>
              <input
                type="text"
                className="input w-full"
                placeholder="ej: cada 12h"
                value={form.frecuencia}
                onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha inicio *</label>
              <input
                type="date"
                className="input w-full"
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha fin</label>
              <input
                type="date"
                className="input w-full"
                value={form.fecha_fin}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Indicaciones</label>
            <textarea
              className="input w-full"
              placeholder="Instrucciones especiales"
              rows={2}
              value={form.indicaciones}
              onChange={(e) => setForm({ ...form, indicaciones: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={guardarTratamiento}
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
