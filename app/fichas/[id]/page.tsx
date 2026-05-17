"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { formatFechaHora, formatEdad } from "@/lib/utils";
import { exportarFichaPDF } from "@/lib/pdfExporter";

const BUCKET_NAME = "documentos-veterinaria-scarlet";

type Paciente = {
  id: number;
  nombre: string;
  raza?: string | null;
  fecha_nacimiento?: string | null;
  color?: string | null;
  esterilizado?: boolean;
};

type Vacuna = {
  id: number;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis?: string | null;
  observaciones?: string | null;
};

type Tratamiento = {
  id: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  indicaciones?: string | null;
  ficha_clinica_info?: { id: number; fecha: string; motivo_consulta: string } | null;
};

type Archivo = {
  id: number;
  archivo_url: string;
  storage_path?: string | null;
  tipo?: number | string;
  tipo_nombre?: string;
  fecha: string;
  observaciones?: string | null;
};

type FichaHistorial = {
  id: number;
  fecha: string;
  motivo_consulta: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
};

type FichaDetalle = {
  id: number;
  paciente: Paciente;
  paciente_nombre: string;
  tutor_nombre: string;
  especie_nombre: string;
  sexo_nombre: string;
  fecha_nacimiento?: string | null;
  fecha: string;
  motivo_consulta: string;
  anamnesis?: string | null;
  peso_kg?: string | null;
  temperatura?: string | null;
  frecuencia_cardiaca?: number | null;
  frecuencia_respiratoria?: number | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
  indicaciones?: string | null;
  observaciones?: string | null;
  vacunas: Vacuna[];
  tratamientos: Tratamiento[];
  archivos: Archivo[];
  historial_fichas: FichaHistorial[];
};

export default function DetalleFichaPage() {
  const params = useParams();
  const fichaId = params.id as string;

  const [ficha, setFicha] = useState<FichaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [visorUrl, setVisorUrl] = useState<string | null>(null);
  const [archivoEditando, setArchivoEditando] = useState<Archivo | null>(null);
  const [tiposArchivo, setTiposArchivo] = useState<{ id: number; nombre: string }[]>([]);

  // Confirm dialog para eliminar archivo
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [archivoAEliminar, setArchivoAEliminar] = useState<Archivo | null>(null);

  const cargarFicha = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/fichas/${fichaId}/`);
      if (!res.ok) { toast.error("No se pudo cargar la ficha"); setFicha(null); return; }
      setFicha(await res.json());
    } catch {
      toast.error("Error cargando ficha");
      setFicha(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarTiposArchivo = async () => {
    try {
      const res = await apiFetch("/tipos-archivo/");
      if (res.ok) { const d = await res.json(); setTiposArchivo(d.results ?? d); }
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    if (fichaId) {
      cargarFicha();
      cargarTiposArchivo();
    }
  }, [fichaId]);

  // ── Eliminar archivo ──────────────────────────────────────────────────────
  const pedirConfirmacionEliminar = (archivo: Archivo) => {
    setArchivoAEliminar(archivo);
    setConfirmEliminar(true);
  };

  const eliminarArchivo = async () => {
    if (!archivoAEliminar) return;
    setConfirmEliminar(false);

    try {
      if (archivoAEliminar.storage_path) {
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([archivoAEliminar.storage_path]);
        if (error) { toast.error("No se pudo eliminar el archivo de Supabase"); return; }
      }

      const res = await apiFetch(`/archivos/${archivoAEliminar.id}/`, { method: "DELETE" });
      if (!res.ok) { toast.error("Se eliminó de Supabase, pero no del backend"); return; }

      toast.success("Documento eliminado correctamente");
      cargarFicha();
    } catch {
      toast.error("Error eliminando documento");
    } finally {
      setArchivoAEliminar(null);
    }
  };

  // ── Reemplazar archivo ────────────────────────────────────────────────────
  const reemplazarArchivo = (archivo: Archivo) => {
    if (!ficha) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const ext = file.name.split(".").pop();
        const fileName = `paciente_${ficha.paciente.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
        if (uploadError) { toast.error("Error subiendo archivo"); return; }

        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

        if (archivo.storage_path) {
          await supabase.storage.from(BUCKET_NAME).remove([archivo.storage_path]);
        }

        const res = await apiFetch(`/archivos/${archivo.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ archivo_url: data.publicUrl, storage_path: fileName }),
        });

        if (!res.ok) { toast.error("Error actualizando documento"); return; }

        toast.success("Documento reemplazado");
        cargarFicha();
      } catch {
        toast.error("Error reemplazando documento");
      }
    };

    input.click();
  };

  // ── Editar metadatos de archivo ───────────────────────────────────────────
  const guardarEdicionArchivo = async () => {
    if (!archivoEditando) return;

    try {
      const res = await apiFetch(`/archivos/${archivoEditando.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          tipo: Number(archivoEditando.tipo),
          fecha: archivoEditando.fecha,
          observaciones: archivoEditando.observaciones,
        }),
      });

      if (!res.ok) { toast.error("Error actualizando documento"); return; }

      toast.success("Documento actualizado");
      setArchivoEditando(null);
      cargarFicha();
    } catch {
      toast.error("Error de conexión");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="skeleton h-6 w-32 mb-6 rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="skeleton h-5 w-1/3 mb-3" />
                <div className="skeleton h-4 w-2/3 mb-2" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!ficha) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="card mx-auto max-w-4xl">
          <BackButton href="/fichas" />
          <p className="text-muted mt-4">Ficha no encontrada.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <BackButton href="/fichas" label="Volver a fichas" />
            <h1 className="title mt-2">Ficha clínica</h1>
            <p className="text-muted">{formatFechaHora(ficha.fecha)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                try {
                  exportarFichaPDF(ficha);
                } catch {
                  toast.error("No se pudo generar el PDF");
                }
              }}
              className="btn-secondary"
            >
              Exportar PDF
            </button>
            <Link href={`/fichas/${ficha.id}/editar`} className="btn-secondary">
              Editar ficha
            </Link>
            <Link href={`/vacunas/nueva?paciente=${ficha.paciente.id}&ficha=${ficha.id}`} className="btn-primary">
              + Vacuna
            </Link>
            <Link
              href={`/tratamientos/nuevo?paciente=${ficha.paciente.id}&ficha=${ficha.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              + Tratamiento
            </Link>
            <Link
              href={`/archivos/nuevo?paciente=${ficha.paciente.id}&ficha=${ficha.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              + Documento
            </Link>
            <Link href={`/pacientes/${ficha.paciente.id}`} className="btn-secondary">
              Ver paciente
            </Link>
          </div>
        </div>

        {/* Paciente */}
        <section className="card">
          <h2 className="subtitle mb-4">Paciente</h2>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <p><strong>Nombre:</strong> {ficha.paciente_nombre}</p>
            <p><strong>Tutor:</strong> {ficha.tutor_nombre}</p>
            <p><strong>Especie:</strong> {ficha.especie_nombre || "-"}</p>
            <p><strong>Raza:</strong> {ficha.paciente.raza || "-"}</p>
            <p><strong>Sexo:</strong> {ficha.sexo_nombre || "-"}</p>
            <p><strong>Edad:</strong> {formatEdad(ficha.fecha_nacimiento || ficha.paciente.fecha_nacimiento)}</p>
            <p><strong>Color:</strong> {ficha.paciente.color || "-"}</p>
            <p><strong>Esterilizado:</strong> {ficha.paciente.esterilizado ? "Sí" : "No"}</p>
          </div>
        </section>

        {/* Consulta */}
        <section className="card">
          <h2 className="subtitle mb-4">Consulta</h2>

          <div className="grid gap-3 md:grid-cols-4 text-sm mb-4">
            {ficha.peso_kg && <div className="rounded-lg bg-slate-50 p-3 border"><p className="text-muted text-xs">Peso</p><p className="font-semibold">{ficha.peso_kg} kg</p></div>}
            {ficha.temperatura && <div className="rounded-lg bg-slate-50 p-3 border"><p className="text-muted text-xs">Temperatura</p><p className="font-semibold">{ficha.temperatura} °C</p></div>}
            {ficha.frecuencia_cardiaca && <div className="rounded-lg bg-slate-50 p-3 border"><p className="text-muted text-xs">F. cardíaca</p><p className="font-semibold">{ficha.frecuencia_cardiaca} lpm</p></div>}
            {ficha.frecuencia_respiratoria && <div className="rounded-lg bg-slate-50 p-3 border"><p className="text-muted text-xs">F. respiratoria</p><p className="font-semibold">{ficha.frecuencia_respiratoria} rpm</p></div>}
          </div>

          <div className="space-y-3 text-sm">
            <div><p className="font-semibold text-slate-700">Motivo de consulta</p><p className="text-slate-600 mt-1">{ficha.motivo_consulta}</p></div>
            {ficha.anamnesis && <div><p className="font-semibold text-slate-700">Anamnesis</p><p className="text-slate-600 mt-1">{ficha.anamnesis}</p></div>}
            {ficha.diagnostico && <div><p className="font-semibold text-slate-700">Diagnóstico</p><p className="text-slate-600 mt-1">{ficha.diagnostico}</p></div>}
            {ficha.tratamiento && <div><p className="font-semibold text-slate-700">Tratamiento</p><p className="text-slate-600 mt-1">{ficha.tratamiento}</p></div>}
            {ficha.indicaciones && <div><p className="font-semibold text-slate-700">Indicaciones</p><p className="text-slate-600 mt-1">{ficha.indicaciones}</p></div>}
            {ficha.observaciones && <div><p className="font-semibold text-slate-700">Observaciones</p><p className="text-slate-600 mt-1">{ficha.observaciones}</p></div>}
          </div>
        </section>

        {/* Vacunas */}
        <section className="card">
          <h2 className="subtitle mb-4">Vacunas</h2>
          {ficha.vacunas.length === 0 ? (
            <p className="text-muted">No hay vacunas registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-2 font-medium">Vacuna</th>
                    <th className="pb-2 font-medium">Aplicación</th>
                    <th className="pb-2 font-medium">Próxima dosis</th>
                    <th className="pb-2 font-medium">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.vacunas.map((v) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{v.nombre_vacuna}</td>
                      <td className="py-2">{v.fecha_aplicacion}</td>
                      <td className={`py-2 ${v.proxima_dosis && new Date(v.proxima_dosis) < new Date() ? "text-red-600 font-medium" : ""}`}>
                        {v.proxima_dosis || "-"}
                      </td>
                      <td className="py-2 text-slate-500">{v.observaciones || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Tratamientos */}
        <section className="card">
          <h2 className="subtitle mb-4">Tratamientos</h2>
          {ficha.tratamientos.length === 0 ? (
            <p className="text-muted">No hay tratamientos registrados.</p>
          ) : (
            <div className="space-y-3">
              {ficha.tratamientos.map((t) => (
                <div key={t.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{t.medicamento}</p>
                      <p className="text-muted">{t.dosis} · {t.frecuencia}</p>
                      <p className="text-muted">
                        {t.fecha_inicio} → {t.fecha_fin || "indefinido"}
                      </p>
                      {t.indicaciones && <p className="text-sm text-slate-700 mt-2">{t.indicaciones}</p>}
                    </div>
                    {t.ficha_clinica_info && t.ficha_clinica_info.id === parseInt(fichaId) && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex-shrink-0">
                        Vinculado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Historial */}
        <section className="card">
          <h2 className="subtitle mb-4">Historial de fichas del paciente</h2>
          {ficha.historial_fichas.length === 0 ? (
            <p className="text-muted">No hay fichas anteriores.</p>
          ) : (
            <div className="space-y-2">
              {ficha.historial_fichas.map((h) => (
                <Link
                  key={h.id}
                  href={`/fichas/${h.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{h.motivo_consulta}</p>
                    <p className="text-muted">{formatFechaHora(h.fecha)}</p>
                  </div>
                  <span className="text-slate-400 text-sm">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Archivos */}
        <section className="card">
          <h2 className="subtitle mb-4">Documentos</h2>
          {ficha.archivos.length === 0 ? (
            <p className="text-muted">No hay documentos adjuntos.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {ficha.archivos.map((archivo) => {
                const url = archivo.archivo_url || "";
                const esImagen = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                const esPdf = /\.pdf$/i.test(url);

                return (
                  <div key={archivo.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900 capitalize">
                          {archivo.tipo_nombre || "Documento"}
                        </p>
                        <p className="text-muted">{archivo.fecha || "Sin fecha"}</p>
                      </div>
                    </div>

                    {esImagen && (
                      <img
                        src={url}
                        alt={archivo.tipo_nombre || "Documento"}
                        onClick={() => setVisorUrl(url)}
                        className="mb-3 max-h-48 w-full cursor-pointer rounded-lg object-cover hover:opacity-90 transition-opacity"
                      />
                    )}

                    {esPdf && (
                      <div className="mb-3 overflow-hidden rounded-lg border bg-white">
                        <iframe src={url} className="h-64 w-full" title={archivo.tipo_nombre || "PDF"} />
                        <div className="border-t bg-slate-50 px-3 py-2 text-xs text-slate-500 flex items-center justify-between">
                          <span>Vista previa</span>
                          <button onClick={() => setVisorUrl(url)} className="text-blue-600 hover:underline font-medium">
                            Ver completo
                          </button>
                        </div>
                      </div>
                    )}

                    {archivo.observaciones && (
                      <p className="text-sm text-slate-600 mb-3">{archivo.observaciones}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <a href={url} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                        {esPdf ? "Abrir PDF" : "Ver"}
                      </a>
                      <button onClick={() => reemplazarArchivo(archivo)} className="rounded-lg bg-yellow-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-600 transition-colors">
                        Reemplazar
                      </button>
                      <button onClick={() => setArchivoEditando({ ...archivo })} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                        Editar
                      </button>
                      <button onClick={() => pedirConfirmacionEliminar(archivo)} className="btn-danger text-sm">
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Visor de imagen/PDF a pantalla completa */}
      {visorUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setVisorUrl(null)}
        >
          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVisorUrl(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80"
            >
              ✕ Cerrar
            </button>
            {visorUrl.match(/\.pdf$/i) ? (
              <iframe src={visorUrl} className="h-[85vh] w-full" title="Vista ampliada PDF" />
            ) : (
              <img src={visorUrl} alt="Vista ampliada" className="max-h-[85vh] w-full object-contain" />
            )}
          </div>
        </div>
      )}

      {/* Modal editar metadatos de archivo */}
      {archivoEditando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setArchivoEditando(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="subtitle">Editar documento</h2>

            <select
              className="input w-full"
              value={archivoEditando.tipo || ""}
              onChange={(e) => setArchivoEditando({ ...archivoEditando, tipo: e.target.value })}
            >
              <option value="">Tipo de documento</option>
              {tiposArchivo.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha</label>
              <input
                type="date"
                className="input w-full"
                value={archivoEditando.fecha || ""}
                onChange={(e) => setArchivoEditando({ ...archivoEditando, fecha: e.target.value })}
              />
            </div>

            <textarea
              className="input w-full"
              placeholder="Observaciones"
              rows={3}
              value={archivoEditando.observaciones || ""}
              onChange={(e) => setArchivoEditando({ ...archivoEditando, observaciones: e.target.value })}
            />

            <div className="flex gap-2 pt-2">
              <button onClick={guardarEdicionArchivo} className="btn-primary">Guardar</button>
              <button onClick={() => setArchivoEditando(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm eliminar archivo */}
      <ConfirmDialog
        open={confirmEliminar}
        title="Eliminar documento"
        message="¿Estás seguro? El archivo se eliminará permanentemente de Supabase y del sistema."
        confirmLabel="Eliminar"
        danger
        onConfirm={eliminarArchivo}
        onCancel={() => { setConfirmEliminar(false); setArchivoAEliminar(null); }}
      />
    </main>
  );
}
