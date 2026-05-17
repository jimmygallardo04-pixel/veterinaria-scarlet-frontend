"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";

type Paciente = { uuid: string; nombre: string; tutor_nombre: string };
type TipoArchivo = { id: number; nombre: string };

const BUCKET_NAME = "documentos-veterinaria-scarlet";

export default function NuevoArchivoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pacienteParam = searchParams.get("paciente");
  const fichaParam = searchParams.get("ficha");

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tiposArchivo, setTiposArchivo] = useState<TipoArchivo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [dragActivo, setDragActivo] = useState(false);

  const [form, setForm] = useState({
    paciente: pacienteParam || "",
    tipo: "",
    archivo: null as File | null,
    fecha: new Date().toISOString().slice(0, 10),
    observaciones: "",
  });

  useEffect(() => {
    Promise.all([
      apiFetch("/pacientes/?page_size=200").then(async (r) => {
        if (r.ok) {
          const d = await r.json();
          setPacientes(d.results ?? d);
        }
      }),
      apiFetch("/tipos-archivo/").then(async (r) => {
        if (r.ok) {
          const d = await r.json();
          setTiposArchivo(d.results ?? d);
        }
      }),
    ]);
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      paciente: pacienteParam || "",
    }));
  }, [pacienteParam]);

  const cambiarPaciente = (uuid: string) => {
    setForm((prev) => ({
      ...prev,
      paciente: uuid,
    }));

    if (uuid) {
      router.replace(
        `/archivos/nuevo?paciente=${uuid}${fichaParam ? `&ficha=${fichaParam}` : ""}`
      );
    } else {
      router.replace(
        fichaParam ? `/archivos/nuevo?ficha=${fichaParam}` : "/archivos/nuevo"
      );
    }
  };

  const validarArchivo = (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Solo se permiten imágenes o PDF");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Máximo 10MB");
      return false;
    }

    return true;
  };

  const seleccionarArchivo = (file: File | null) => {
    if (!file || !validarArchivo(file)) return;

    setForm((f) => ({
      ...f,
      archivo: file,
    }));
  };

  const guardarArchivo = async () => {
    if (!form.paciente || !form.tipo || !form.archivo || !form.fecha) {
      toast.warning("Completa todos los campos y selecciona un archivo");
      return;
    }

    try {
      setGuardando(true);

      const file = form.archivo;
      const ext = file.name.split(".").pop();
      const fileName = `paciente_${form.paciente}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) {
        toast.error("Error subiendo archivo");
        return;
      }

      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

      const res = await apiFetch("/archivos/", {
        method: "POST",
        body: JSON.stringify({
          paciente: form.paciente,
          tipo: Number(form.tipo),
          archivo_url: data.publicUrl,
          storage_path: fileName,
          fecha: form.fecha,
          observaciones: form.observaciones || null,
        }),
      });

      if (!res.ok) {
        toast.error("Error guardando en backend");
        return;
      }

      toast.success("Documento guardado");
      router.push(fichaParam ? `/fichas/${fichaParam}` : "/fichas");
    } catch {
      toast.error("Error general");
    } finally {
      setGuardando(false);
    }
  };

  const pacienteSeleccionado = pacientes.find((p) => p.uuid === form.paciente);
  const backHref = fichaParam ? `/fichas/${fichaParam}` : "/fichas";

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <BackButton href={backHref} />
          <h1 className="title mt-2">Registrar documento</h1>
          <p className="text-muted">Sube una imagen o PDF al historial del paciente.</p>
        </div>

        <section className="card">
          <h2 className="subtitle mb-3">Paciente</h2>

          <select
            className="input w-full"
            value={form.paciente}
            onChange={(e) => cambiarPaciente(e.target.value)}
          >
            <option value="">Seleccionar paciente *</option>
            {pacientes.map((p) => (
              <option key={p.uuid} value={p.uuid}>
                {p.nombre} · Tutor: {p.tutor_nombre}
              </option>
            ))}
          </select>

          {pacienteSeleccionado && (
            <p className="text-muted mt-2">{pacienteSeleccionado.nombre}</p>
          )}
        </section>

        <section className="card">
          <h2 className="subtitle mb-4">Documento</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="input"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option value="">Tipo de documento *</option>
              {tiposArchivo.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Fecha del documento *
              </label>
              <input
                type="date"
                className="input"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragActivo(true);
            }}
            onDragLeave={() => setDragActivo(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActivo(false);
              seleccionarArchivo(e.dataTransfer.files?.[0] || null);
            }}
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragActivo
                ? "border-green-500 bg-green-50"
                : "border-slate-300 bg-slate-50 hover:bg-white"
            }`}
          >
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm font-medium text-slate-700">
              Arrastra un archivo aquí o haz click para seleccionar
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF o imagen · máximo 10MB</p>

            {form.archivo && (
              <div className="mt-3 rounded-lg bg-green-100 px-4 py-2 text-sm text-green-800 font-medium">
                ✓ {form.archivo.name}
              </div>
            )}

            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => seleccionarArchivo(e.target.files?.[0] || null)}
            />
          </label>

          <textarea
            className="input mt-3"
            placeholder="Observaciones"
            rows={3}
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          />

          <div className="mt-4 flex gap-2">
            <button onClick={guardarArchivo} disabled={guardando} className="btn-primary">
              {guardando ? "Subiendo..." : "Guardar documento"}
            </button>

            <button onClick={() => router.push(backHref)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}