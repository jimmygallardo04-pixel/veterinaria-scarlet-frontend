"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Paciente = {
  id: number;
  nombre: string;
  tutor_nombre: string;
};

type TipoArchivo = {
  id: number;
  codigo: string;
  nombre: string;
};

type FormArchivo = {
  paciente: string;
  tipo: string;
  archivo: File | null;
  fecha: string;
  observaciones: string;
};

const BUCKET_NAME = "documentos-veterinaria-scarlet";

export default function NuevoArchivoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const pacienteParam = searchParams.get("paciente");
  const fichaParam = searchParams.get("ficha");

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tiposArchivo, setTiposArchivo] = useState<TipoArchivo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [dragActivo, setDragActivo] = useState(false);

  const [form, setForm] = useState<FormArchivo>({
    paciente: pacienteParam || "",
    tipo: "",
    archivo: null,
    fecha: new Date().toISOString().slice(0, 10),
    observaciones: "",
  });

  const getToken = () => sessionStorage.getItem("access");

  const cargarPacientes = async () => {
    try {
      const res = await fetch(`${apiUrl}/pacientes/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();
      setPacientes(data);
    } catch (error) {
      console.log(error);
      toast.error("Error cargando pacientes");
    }
  };

  const cargarTiposArchivo = async () => {
    try {
      const res = await fetch(`${apiUrl}/tipos-archivo/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();
      setTiposArchivo(data);
    } catch (error) {
      console.log(error);
      toast.error("Error cargando tipos de documento");
    }
  };

  useEffect(() => {
    cargarPacientes();
    cargarTiposArchivo();
  }, []);

  const validarArchivo = (file: File) => {
    const maxSize = 10 * 1024 * 1024;

    const esImagen = file.type.startsWith("image/");
    const esPdf = file.type === "application/pdf";

    if (!esImagen && !esPdf) {
      toast.error("Solo se permiten imágenes o PDF");
      return false;
    }

    if (file.size > maxSize) {
      toast.error("Máximo 10MB");
      return false;
    }

    return true;
  };

  const seleccionarArchivo = (file: File | null) => {
    if (!file) return;

    if (!validarArchivo(file)) {
      setForm({ ...form, archivo: null });
      return;
    }

    setForm({ ...form, archivo: file });
  };

  const guardarArchivo = async () => {
    if (!form.paciente || !form.tipo || !form.archivo || !form.fecha) {
      toast.warning("Completa todos los campos");
      return;
    }

    if (!validarArchivo(form.archivo)) return;

    try {
      setGuardando(true);

      const file = form.archivo;
      const extension = file.name.split(".").pop();

      const fileName = `paciente_${form.paciente}/${Date.now()}_${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (error) {
        console.log(error);
        toast.error("Error subiendo archivo");
        return;
      }

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const archivoUrl = data.publicUrl;

      const res = await fetch(`${apiUrl}/archivos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          paciente: Number(form.paciente),
          tipo: Number(form.tipo),
          archivo_url: archivoUrl,
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

      if (fichaParam) {
        router.push(`/fichas/${fichaParam}`);
      } else {
        router.push("/fichas");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error general");
    } finally {
      setGuardando(false);
    }
  };

  const pacienteSeleccionado = pacientes.find(
    (p) => String(p.id) === form.paciente
  );

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="title">Registrar documento</h1>

        <section className="card">
          <h2 className="subtitle mb-3">Paciente</h2>

          <select
            className="input w-full"
            value={form.paciente}
            onChange={(e) => setForm({ ...form, paciente: e.target.value })}
          >
            <option value="">Seleccionar paciente</option>

            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} · Tutor: {p.tutor_nombre}
              </option>
            ))}
          </select>

          {pacienteSeleccionado && (
            <p className="mt-2 text-sm text-muted">
              {pacienteSeleccionado.nombre}
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="subtitle mb-3">Documento</h2>

          <select
            className="input mb-3"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="">Seleccionar tipo *</option>

            {tiposArchivo.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragActivo(true);
            }}
            onDragLeave={() => setDragActivo(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActivo(false);

              const file = e.dataTransfer.files?.[0] || null;
              seleccionarArchivo(file);
            }}
            className={`mb-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
              dragActivo
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-white hover:bg-slate-50"
            }`}
          >
            <p className="text-sm font-medium text-slate-700">
              Arrastra un archivo aquí o haz click para seleccionar
            </p>
            <p className="mt-1 text-xs text-slate-500">
              PDF o imagen, máximo 10MB
            </p>

            {form.archivo && (
              <div className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                Archivo seleccionado:{" "}
                <strong>{form.archivo.name}</strong>
              </div>
            )}

            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) =>
                seleccionarArchivo(e.target.files?.[0] || null)
              }
            />
          </label>

          <input
            type="date"
            className="input mb-3"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
          />

          <textarea
            className="input"
            placeholder="Observaciones"
            value={form.observaciones}
            onChange={(e) =>
              setForm({ ...form, observaciones: e.target.value })
            }
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={guardarArchivo}
              disabled={guardando}
              className="btn-primary"
            >
              {guardando ? "Guardando..." : "Guardar documento"}
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