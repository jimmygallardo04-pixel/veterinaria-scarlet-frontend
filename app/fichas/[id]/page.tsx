"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "documentos-veterinaria-scarlet";

type Paciente = {
  id: number;
  nombre: string;
  raza?: string | null;
  edad?: number | null;
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
  edad?: number | null;

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
  const router = useRouter();

  const fichaId = params.id as string;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [ficha, setFicha] = useState<FichaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [visorUrl, setVisorUrl] = useState<string | null>(null);

  const [archivoEditando, setArchivoEditando] = useState<any | null>(null);
  const [tiposArchivo, setTiposArchivo] = useState<any[]>([]);

  const getToken = () => sessionStorage.getItem("access");

  const cargarFicha = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${apiUrl}/fichas/${fichaId}/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        toast.error("No se pudo cargar la ficha");
        setFicha(null);
        return;
      }

      const data = await res.json();
      setFicha(data);
    } catch (error) {
      console.log(error);
      toast.error("Error cargando ficha");
      setFicha(null);
    } finally {
      setLoading(false);
    }
  };

  const eliminarArchivo = async (archivo: Archivo) => {
    const confirmar = confirm("¿Eliminar este documento?");
    if (!confirmar) return;

    try {
      if (archivo.storage_path) {
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([archivo.storage_path]);

        if (error) {
          console.log(error);
          toast.error("No se pudo eliminar el archivo de Supabase");
          return;
        }
      }

      const res = await fetch(`${apiUrl}/archivos/${archivo.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        toast.error("Se eliminó de Supabase, pero no del backend");
        return;
      }

      toast.success("Documento eliminado correctamente");
      cargarFicha();
    } catch (error) {
      console.log(error);
      toast.error("Error eliminando documento");
    }
  };

  const reemplazarArchivo = async (archivo: Archivo) => {
    if (!ficha) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      try {
        const extension = file.name.split(".").pop();
        const fileName = `paciente_${ficha.paciente.id}/${Date.now()}_${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file);

        if (uploadError) {
          console.log(uploadError);
          toast.error("Error subiendo archivo");
          return;
        }

        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        if (archivo.storage_path) {
          await supabase.storage
            .from(BUCKET_NAME)
            .remove([archivo.storage_path]);
        }

        const res = await fetch(`${apiUrl}/archivos/${archivo.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            archivo_url: data.publicUrl,
            storage_path: fileName,
          }),
        });

        if (!res.ok) {
          toast.error("Error actualizando documento");
          return;
        }

        toast.success("Documento reemplazado");
        cargarFicha();
      } catch (err) {
        console.log(err);
        toast.error("Error reemplazando documento");
      }
    };

    input.click();
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
    } catch (e) {
      console.log(e);
    }
  };

  const guardarEdicionArchivo = async () => {
    if (!archivoEditando) return;

    try {
      const res = await fetch(
        `${apiUrl}/archivos/${archivoEditando.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            tipo: Number(archivoEditando.tipo),
            fecha: archivoEditando.fecha,
            observaciones: archivoEditando.observaciones,
          }),
        }
      );

      if (!res.ok) {
        toast.error("Error actualizando documento");
        return;
      }

      toast.success("Documento actualizado");
      setArchivoEditando(null);
      cargarFicha();
    } catch (e) {
      console.log(e);
      toast.error("Error");
    }
  };

  useEffect(() => {
    if (fichaId) {
      cargarFicha();
      cargarTiposArchivo();
    }
  }, [fichaId]);

  if (loading) {
    return <main className="p-8">Cargando...</main>;
  }

  if (!ficha) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="card mx-auto max-w-4xl">
          <p className="text-muted">Ficha no encontrada.</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            Volver
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="title">Ficha clínica</h1>
            <p className="text-muted">
              {new Date(ficha.fecha).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/fichas" className="rounded-lg border px-4 py-2">
              Volver
            </Link>

            <Link
              href={`/fichas/${ficha.id}/editar`}
              className="rounded-lg border px-4 py-2"
            >
              Editar ficha
            </Link>

            <Link
              href={`/vacunas/nueva?paciente=${ficha.paciente.id}&ficha=${ficha.id}`}
              className="rounded-lg bg-green-600 px-4 py-2 text-white"
            >
              + Vacuna
            </Link>

            <Link
              href={`/tratamientos/nuevo?paciente=${ficha.paciente.id}&ficha=${ficha.id}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              + Tratamiento
            </Link>

            <Link
              href={`/archivos/nuevo?paciente=${ficha.paciente.id}&ficha=${ficha.id}`}
              className="rounded-lg bg-slate-700 px-4 py-2 text-white"
            >
              + Documento
            </Link>

            <Link
              href={`/pacientes/${ficha.paciente.id}`}
              className="btn-primary"
            >
              Ver paciente
            </Link>
          </div>
        </div>

        {/* PACIENTE */}
        <section className="card">
          <h2 className="subtitle mb-3">Paciente</h2>
          <p>
            <strong>Nombre:</strong> {ficha.paciente_nombre}
          </p>
          <p>
            <strong>Especie:</strong> {ficha.especie_nombre || "-"}
          </p>
          <p>
            <strong>Raza:</strong> {ficha.paciente.raza || "-"}
          </p>
          <p>
            <strong>Sexo:</strong> {ficha.sexo_nombre || "-"}
          </p>
          <p>
            <strong>Edad:</strong> {ficha.edad ?? "-"}
          </p>
          <p>
            <strong>Color:</strong> {ficha.paciente.color || "-"}
          </p>
          <p>
            <strong>Esterilizado:</strong>{" "}
            {ficha.paciente.esterilizado ? "Sí" : "No"}
          </p>
          <p>
            <strong>Tutor:</strong> {ficha.tutor_nombre}
          </p>
        </section>

        {/* CONSULTA COMPLETA */}
        <section className="card">
          <h2 className="subtitle mb-3">Consulta</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <p>
              <strong>Motivo:</strong> {ficha.motivo_consulta}
            </p>
            <p>
              <strong>Peso:</strong> {ficha.peso_kg || "-"} kg
            </p>
            <p>
              <strong>Temperatura:</strong> {ficha.temperatura || "-"} °C
            </p>
            <p>
              <strong>F. cardíaca:</strong>{" "}
              {ficha.frecuencia_cardiaca || "-"}
            </p>
            <p>
              <strong>F. respiratoria:</strong>{" "}
              {ficha.frecuencia_respiratoria || "-"}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <p>
              <strong>Anamnesis:</strong> {ficha.anamnesis || "-"}
            </p>
            <p>
              <strong>Diagnóstico:</strong> {ficha.diagnostico || "-"}
            </p>
            <p>
              <strong>Tratamiento:</strong> {ficha.tratamiento || "-"}
            </p>
            <p>
              <strong>Indicaciones:</strong> {ficha.indicaciones || "-"}
            </p>
            <p>
              <strong>Observaciones:</strong> {ficha.observaciones || "-"}
            </p>
          </div>
        </section>

        {/* VACUNAS */}
        <section className="card">
          <h2 className="subtitle mb-3">Vacunas</h2>

          {ficha.vacunas.length === 0 ? (
            <p className="text-muted">No hay vacunas registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Vacuna</th>
                    <th>Aplicación</th>
                    <th>Próxima dosis</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.vacunas.map((vacuna) => (
                    <tr key={vacuna.id} className="border-b">
                      <td className="py-2">{vacuna.nombre_vacuna}</td>
                      <td>{vacuna.fecha_aplicacion}</td>
                      <td>{vacuna.proxima_dosis || "-"}</td>
                      <td>{vacuna.observaciones || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* TRATAMIENTOS */}
        <section className="card">
          <h2 className="subtitle mb-3">Tratamientos</h2>

          {ficha.tratamientos.length === 0 ? (
            <p className="text-muted">No hay tratamientos registrados.</p>
          ) : (
            <div className="space-y-3">
              {ficha.tratamientos.map((tratamiento) => (
                <div key={tratamiento.id} className="rounded-lg border p-3">
                  <p className="font-semibold">{tratamiento.medicamento}</p>
                  <p className="text-sm text-muted">
                    {tratamiento.dosis} · {tratamiento.frecuencia}
                  </p>
                  <p className="text-sm text-muted">
                    Desde {tratamiento.fecha_inicio} hasta{" "}
                    {tratamiento.fecha_fin || "-"}
                  </p>

                  {tratamiento.indicaciones && (
                    <p className="mt-2 text-sm">{tratamiento.indicaciones}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* HISTORIAL */}
        <section className="card">
          <h2 className="subtitle mb-3">Historial de fichas</h2>

          {ficha.historial_fichas.length === 0 ? (
            <p className="text-muted">No hay fichas anteriores.</p>
          ) : (
            <div className="space-y-3">
              {ficha.historial_fichas.map((historial) => (
                <Link
                  key={historial.id}
                  href={`/fichas/${historial.id}`}
                  className="block rounded-lg border p-3 hover:bg-slate-50"
                >
                  <p className="text-sm text-muted">
                    {new Date(historial.fecha).toLocaleString()}
                  </p>
                  <p className="font-semibold">
                    {historial.motivo_consulta}
                  </p>
                  <p className="text-sm text-muted">
                    Diagnóstico: {historial.diagnostico || "-"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ARCHIVOS */}
        <section className="card">
          <h2 className="subtitle mb-3">Archivos</h2>

          {ficha.archivos.length === 0 ? (
            <p className="text-muted">No hay archivos registrados.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {ficha.archivos.map((archivo) => {
                const url = archivo.archivo_url || "";
                const esImagen = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                const esPdf = /\.pdf$/i.test(url);

                return (
                  <div key={archivo.id} className="rounded-lg border p-3">
                    <div className="mb-2">
                      <p className="font-semibold capitalize">
                        {archivo.tipo_nombre || archivo.tipo || "Documento"}
                      </p>
                      <p className="text-sm text-muted">
                        {archivo.fecha || "Sin fecha"}
                      </p>
                    </div>

                    {esImagen && (
                      <img
                        src={url}
                        alt={archivo.tipo_nombre || "Documento"}
                        onClick={() => setVisorUrl(url)}
                        className="mb-3 max-h-48 w-full cursor-pointer rounded-lg object-cover"
                      />
                    )}

                    {esPdf && (
                      <div className="mb-3 overflow-hidden rounded-lg border bg-white">
                        <iframe
                          src={url}
                          className="h-72 w-full"
                          title={archivo.tipo_nombre || "Documento PDF"}
                        />

                        <div className="border-t bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          Vista previa del PDF
                          <button
                            onClick={() => setVisorUrl(url)}
                            className="ml-2 text-xs font-medium text-blue-600 hover:underline"
                          >
                            Ver grande
                          </button>
                        </div>
                      </div>
                    )}

                    {archivo.observaciones && (
                      <p className="mb-3 text-sm">{archivo.observaciones}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary inline-block text-sm"
                      >
                        {esPdf ? "Abrir PDF" : "Ver documento"}
                      </a>

                      <button
                        onClick={() => reemplazarArchivo(archivo)}
                        className="rounded-lg bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600"
                      >
                        Reemplazar
                      </button>

                      <button
                        onClick={() => setArchivoEditando({ ...archivo })}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => eliminarArchivo(archivo)}
                        className="btn-danger text-sm"
                      >
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

      {visorUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setVisorUrl(null)}
        >
          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-lg bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVisorUrl(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-sm text-white"
            >
              Cerrar
            </button>

            {visorUrl.match(/\.pdf$/i) ? (
              <iframe
                src={visorUrl}
                className="h-[85vh] w-full"
                title="Vista ampliada PDF"
              />
            ) : (
              <img
                src={visorUrl}
                alt="Vista ampliada"
                className="max-h-[85vh] w-full object-contain"
              />
            )}
          </div>
        </div>
      )}

      {archivoEditando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setArchivoEditando(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Editar documento</h2>

            <select
              className="input w-full"
              value={archivoEditando.tipo || ""}
              onChange={(e) =>
                setArchivoEditando({
                  ...archivoEditando,
                  tipo: e.target.value,
                })
              }
            >
              <option value="">Tipo</option>
              {tiposArchivo.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="input w-full"
              value={archivoEditando.fecha || ""}
              onChange={(e) =>
                setArchivoEditando({
                  ...archivoEditando,
                  fecha: e.target.value,
                })
              }
            />

            <textarea
              className="input w-full"
              placeholder="Observaciones"
              value={archivoEditando.observaciones || ""}
              onChange={(e) =>
                setArchivoEditando({
                  ...archivoEditando,
                  observaciones: e.target.value,
                })
              }
            />

            <div className="flex gap-2">
              <button
                onClick={guardarEdicionArchivo}
                className="btn-primary"
              >
                Guardar
              </button>

              <button
                onClick={() => setArchivoEditando(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}