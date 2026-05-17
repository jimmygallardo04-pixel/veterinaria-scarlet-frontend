"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

interface ArchivosModalProps {
  open: boolean;
  pacienteId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TipoArchivo {
  id: number;
  nombre: string;
}

const BUCKET_NAME = "documentos-veterinaria-scarlet";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ArchivosModal({
  open,
  pacienteId,
  onClose,
  onSuccess,
}: ArchivosModalProps) {
  const [form, setForm] = useState({
    tipo: "",
    archivo: null as File | null,
    fecha: new Date().toISOString().split("T")[0],
    observaciones: "",
  });
  const [tiposArchivo, setTiposArchivo] = useState<TipoArchivo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (open) {
      cargarTipos();
      setForm({
        tipo: "",
        archivo: null,
        fecha: new Date().toISOString().split("T")[0],
        observaciones: "",
      });
    }
  }, [open]);

  const cargarTipos = async () => {
    try {
      const res = await apiFetch("/tipos-archivo/?page_size=100");
      if (res.ok) {
        const data = await res.json();
        setTiposArchivo(data.results ?? data);
      }
    } catch {
      toast.error("Error cargando tipos de archivo");
    }
  };

  const guardarArchivo = async () => {
    if (!form.tipo || !form.archivo || !form.fecha) {
      toast.warning("Completa todos los campos y selecciona un archivo");
      return;
    }

    if (!form.archivo.type.startsWith("image/") && form.archivo.type !== "application/pdf") {
      toast.error("Solo se permiten imágenes o PDF");
      return;
    }

    if (form.archivo.size > MAX_FILE_SIZE) {
      toast.error("Máximo 10MB");
      return;
    }

    try {
      setGuardando(true);

      const fileExt = form.archivo.name.split(".").pop();
      const fileName = `paciente_${pacienteId}/${Date.now()}_${uuidv4()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, form.archivo, { upsert: false });

      if (uploadError || !uploadData) {
        toast.error("Error subiendo archivo");
        return;
      }

      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path);
      const archivoUrl = data.publicUrl;

      const res = await apiFetch("/archivos/", {
        method: "POST",
        body: JSON.stringify({
          paciente: pacienteId,
          tipo: Number(form.tipo),
          archivo_url: archivoUrl,
          storage_path: uploadData.path,
          fecha: form.fecha,
          observaciones: form.observaciones || null,
        }),
      });

      if (!res.ok) {
        toast.error("Error guardando en backend");
        return;
      }

      toast.success("Documento guardado");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Error general");
    } finally {
      setGuardando(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setForm({ ...form, archivo: e.dataTransfer.files[0] });
    }
  };

  if (!open || !pacienteId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Agregar Documento</h2>

        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tipo de documento *</label>
            <select
              className="input w-full"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option value="">Seleccionar tipo</option>
              {tiposArchivo.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Archivo *</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                dragActive
                  ? "border-green-500 bg-green-50"
                  : "border-slate-300 hover:border-slate-400"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              {form.archivo ? (
                <>
                  <p className="font-semibold text-slate-900">{form.archivo.name}</p>
                  <p className="text-xs text-slate-500">
                    {(form.archivo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setForm({ ...form, archivo: null });
                    }}
                    className="mt-2 text-xs text-red-600 hover:underline"
                  >
                    Cambiar archivo
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600">Arrastra un archivo aquí o haz clic</p>
                  <p className="text-xs text-slate-500 mt-1">Imágenes o PDF (máx 10MB)</p>
                </>
              )}
              <input
                id="file-input"
                type="file"
                hidden
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setForm({ ...form, archivo: e.target.files[0] });
                  }
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha *</label>
            <input
              type="date"
              className="input w-full"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
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
            onClick={guardarArchivo}
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
