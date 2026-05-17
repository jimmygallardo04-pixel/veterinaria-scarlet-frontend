"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface VacunaModalProps {
  open: boolean;
  pacienteId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const formInicial = {
  nombre_vacuna: "",
  fecha_aplicacion: "",
  proxima_dosis: "",
  observaciones: "",
};

export default function VacunaModal({
  open,
  pacienteId,
  onClose,
  onSuccess,
}: VacunaModalProps) {
  const [form, setForm] = useState(formInicial);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(formInicial);
    }
  }, [open]);

  const guardarVacuna = async () => {
    if (!form.nombre_vacuna || !form.fecha_aplicacion) {
      toast.warning("Completa el nombre de la vacuna y la fecha de aplicación");
      return;
    }

    try {
      setGuardando(true);
      const res = await apiFetch("/vacunas/", {
        method: "POST",
        body: JSON.stringify({
          paciente: pacienteId,
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Agregar Vacuna</h2>

        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre de la vacuna *</label>
            <input
              type="text"
              className="input w-full"
              placeholder="ej: Rabia, DHPPC"
              value={form.nombre_vacuna}
              onChange={(e) => setForm({ ...form, nombre_vacuna: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha de aplicación *</label>
            <input
              type="date"
              className="input w-full"
              value={form.fecha_aplicacion}
              onChange={(e) => setForm({ ...form, fecha_aplicacion: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Próxima dosis</label>
            <input
              type="date"
              className="input w-full"
              value={form.proxima_dosis}
              onChange={(e) => setForm({ ...form, proxima_dosis: e.target.value })}
            />
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
            onClick={guardarVacuna}
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
