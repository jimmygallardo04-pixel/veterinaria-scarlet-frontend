"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";
import PageSkeleton from "@/app/components/PageSkeleton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { formatFechaHora } from "@/lib/utils";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Paciente = {
  id: number;
  nombre: string;
  especie_nombre?: string;
  sexo_nombre?: string;
  raza?: string | null;
  color?: string | null;
  edad?: number | null;
  esterilizado: boolean;
  observaciones?: string | null;
  tutor_nombre: string;
};

type Vacuna = {
  id: number;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis?: string | null;
  observaciones?: string | null;
};

type Ficha = {
  id: number;
  fecha: string;
  motivo_consulta: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
};

type Cita = {
  id: number;
  fecha_hora: string;
  motivo: string;
  estado: string;
};

type Tratamiento = {
  id: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
};

// ── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "vacunas" | "fichas" | "citas" | "tratamientos";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "vacunas", label: "Vacunas", icon: "💉" },
  { id: "fichas", label: "Fichas", icon: "📋" },
  { id: "citas", label: "Citas", icon: "📅" },
  { id: "tratamientos", label: "Tratamientos", icon: "💊" },
];

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "badge-yellow",
  completada: "badge-green",
  cancelada: "badge-red",
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function DetallePacientePage() {
  const params = useParams();
  const pacienteId = params.id as string;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);

  const [tab, setTab] = useState<Tab>("vacunas");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Formulario vacuna (crear)
  const vacunaFormInicial = { nombre_vacuna: "", fecha_aplicacion: "", proxima_dosis: "", observaciones: "" };
  const [vacunaForm, setVacunaForm] = useState(vacunaFormInicial);

  // Edición inline de vacuna
  const [vacunaEditando, setVacunaEditando] = useState<number | null>(null);
  const [vacunaEditForm, setVacunaEditForm] = useState({
    nombre_vacuna: "",
    fecha_aplicacion: "",
    proxima_dosis: "",
    observaciones: "",
  });

  // Confirm (vacunas)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [vacunaAEliminar, setVacunaAEliminar] = useState<number | null>(null);

  // Edición inline de tratamiento
  const [tratamientoEditando, setTratamientoEditando] = useState<number | null>(null);
  const [tratamientoEditForm, setTratamientoEditForm] = useState({
    medicamento: "",
    dosis: "",
    frecuencia: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  // Confirm (tratamientos)
  const [confirmTratamiento, setConfirmTratamiento] = useState(false);
  const [tratamientoAEliminar, setTratamientoAEliminar] = useState<number | null>(null);

  // ── Carga de datos ──────────────────────────────────────────────────────────

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [resPaciente, resVacunas, resFichas, resCitas, resTratamientos] = await Promise.all([
        apiFetch(`/pacientes/${pacienteId}/`),
        apiFetch(`/vacunas/?paciente=${pacienteId}`),
        apiFetch(`/fichas/?paciente=${pacienteId}`),
        apiFetch(`/citas/?paciente=${pacienteId}`),
        apiFetch(`/tratamientos/?paciente=${pacienteId}`),
      ]);

      if (resPaciente.ok) setPaciente(await resPaciente.json());
      if (resVacunas.ok) setVacunas(await resVacunas.json());
      if (resFichas.ok) setFichas(await resFichas.json());
      if (resCitas.ok) setCitas(await resCitas.json());
      if (resTratamientos.ok) setTratamientos(await resTratamientos.json());
    } catch {
      toast.error("Error cargando datos del paciente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarTodo(); }, [pacienteId]);

  // ── Vacunas CRUD ────────────────────────────────────────────────────────────

  const crearVacuna = async () => {
    if (!vacunaForm.nombre_vacuna || !vacunaForm.fecha_aplicacion) {
      toast.warning("Nombre y fecha son obligatorios");
      return;
    }
    try {
      setGuardando(true);
      const res = await apiFetch("/vacunas/", {
        method: "POST",
        body: JSON.stringify({
          paciente: Number(pacienteId),
          nombre_vacuna: vacunaForm.nombre_vacuna,
          fecha_aplicacion: vacunaForm.fecha_aplicacion,
          proxima_dosis: vacunaForm.proxima_dosis || null,
          observaciones: vacunaForm.observaciones || null,
        }),
      });
      if (!res.ok) { toast.error("No se pudo registrar la vacuna"); return; }
      toast.success("Vacuna registrada");
      setVacunaForm(vacunaFormInicial);
      const r = await apiFetch(`/vacunas/?paciente=${pacienteId}`);
      if (r.ok) setVacunas(await r.json());
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarVacuna = async () => {
    if (!vacunaAEliminar) return;
    setConfirmOpen(false);
    try {
      const res = await apiFetch(`/vacunas/${vacunaAEliminar}/`, { method: "DELETE" });
      if (!res.ok) { toast.error("No se pudo eliminar la vacuna"); return; }
      toast.success("Vacuna eliminada");
      setVacunas((v) => v.filter((x) => x.id !== vacunaAEliminar));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setVacunaAEliminar(null);
    }
  };

  const iniciarEdicionVacuna = (v: Vacuna) => {
    setVacunaEditando(v.id);
    setVacunaEditForm({
      nombre_vacuna: v.nombre_vacuna,
      fecha_aplicacion: v.fecha_aplicacion,
      proxima_dosis: v.proxima_dosis || "",
      observaciones: v.observaciones || "",
    });
  };

  const editarVacuna = async (id: number) => {
    try {
      const res = await apiFetch(`/vacunas/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre_vacuna: vacunaEditForm.nombre_vacuna,
          fecha_aplicacion: vacunaEditForm.fecha_aplicacion,
          proxima_dosis: vacunaEditForm.proxima_dosis || null,
          observaciones: vacunaEditForm.observaciones || null,
        }),
      });
      if (!res.ok) { toast.error("No se pudo editar la vacuna"); return; }
      toast.success("Vacuna actualizada");
      setVacunaEditando(null);
      const r = await apiFetch(`/vacunas/?paciente=${pacienteId}`);
      if (r.ok) setVacunas(await r.json());
    } catch {
      toast.error("Error de conexión");
    }
  };

  const vacunaVencida = (fecha: string) => new Date(fecha) < new Date();

  // ── Tratamientos CRUD ───────────────────────────────────────────────────────

  const iniciarEdicionTratamiento = (t: Tratamiento) => {
    setTratamientoEditando(t.id);
    setTratamientoEditForm({
      medicamento: t.medicamento,
      dosis: t.dosis,
      frecuencia: t.frecuencia,
      fecha_inicio: t.fecha_inicio,
      fecha_fin: t.fecha_fin || "",
    });
  };

  const editarTratamiento = async (id: number) => {
    try {
      const res = await apiFetch(`/tratamientos/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          medicamento: tratamientoEditForm.medicamento,
          dosis: tratamientoEditForm.dosis,
          frecuencia: tratamientoEditForm.frecuencia,
          fecha_inicio: tratamientoEditForm.fecha_inicio,
          fecha_fin: tratamientoEditForm.fecha_fin || null,
        }),
      });
      if (!res.ok) { toast.error("No se pudo editar el tratamiento"); return; }
      toast.success("Tratamiento actualizado");
      setTratamientoEditando(null);
      const r = await apiFetch(`/tratamientos/?paciente=${pacienteId}`);
      if (r.ok) setTratamientos(await r.json());
    } catch {
      toast.error("Error de conexión");
    }
  };

  const eliminarTratamiento = async () => {
    if (!tratamientoAEliminar) return;
    setConfirmTratamiento(false);
    try {
      const res = await apiFetch(`/tratamientos/${tratamientoAEliminar}/`, { method: "DELETE" });
      if (!res.ok) { toast.error("No se pudo eliminar el tratamiento"); return; }
      toast.success("Tratamiento eliminado");
      setTratamientos((t) => t.filter((x) => x.id !== tratamientoAEliminar));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setTratamientoAEliminar(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="skeleton h-5 w-40 mb-6 rounded" />
          <PageSkeleton rows={4} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="page-header">
          <div>
            <BackButton href="/pacientes" label="Volver a pacientes" />
            <h1 className="title mt-2">
              {paciente?.nombre ?? "Paciente"}
            </h1>
            {paciente && (
              <p className="text-muted">
                {paciente.especie_nombre ?? "Sin especie"}
                {paciente.raza ? ` · ${paciente.raza}` : ""}
                {paciente.sexo_nombre ? ` · ${paciente.sexo_nombre}` : ""}
                {paciente.edad != null ? ` · ${paciente.edad} años` : ""}
                {" · Tutor: "}{paciente.tutor_nombre}
              </p>
            )}
          </div>
          <Link href={`/fichas/nueva?paciente=${pacienteId}`} className="btn-primary">
            + Nueva ficha
          </Link>
        </div>

        {/* Ficha del paciente */}
        {paciente && (
          <section className="card">
            <h2 className="subtitle mb-4">Datos del paciente</h2>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div><p className="text-muted text-xs">Especie</p><p className="font-medium">{paciente.especie_nombre ?? "-"}</p></div>
              <div><p className="text-muted text-xs">Raza</p><p className="font-medium">{paciente.raza ?? "-"}</p></div>
              <div><p className="text-muted text-xs">Sexo</p><p className="font-medium">{paciente.sexo_nombre ?? "-"}</p></div>
              <div><p className="text-muted text-xs">Edad</p><p className="font-medium">{paciente.edad != null ? `${paciente.edad} años` : "-"}</p></div>
              <div><p className="text-muted text-xs">Color</p><p className="font-medium">{paciente.color ?? "-"}</p></div>
              <div><p className="text-muted text-xs">Esterilizado</p><p className="font-medium">{paciente.esterilizado ? "Sí" : "No"}</p></div>
              <div><p className="text-muted text-xs">Tutor</p><p className="font-medium">{paciente.tutor_nombre}</p></div>
            </div>
            {paciente.observaciones && (
              <p className="mt-3 text-sm text-slate-600 border-t border-slate-100 pt-3">{paciente.observaciones}</p>
            )}
          </section>
        )}

        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/fichas/nueva?paciente=${pacienteId}`} className="btn-primary">
            + Nueva ficha
          </Link>
          <Link href={`/vacunas/nueva?paciente=${pacienteId}`} className="btn-secondary">
            + Vacuna
          </Link>
          <Link href={`/tratamientos/nuevo?paciente=${pacienteId}`} className="btn-secondary">
            + Tratamiento
          </Link>
          <Link href={`/archivos/nuevo?paciente=${pacienteId}`} className="btn-secondary">
            + Documento
          </Link>
        </div>

        {/* Tabs */}
        <div>
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-slate-200 mb-4">
            {TABS.map((t) => {
              const count =
                t.id === "vacunas" ? vacunas.length :
                t.id === "fichas" ? fichas.length :
                t.id === "citas" ? citas.length :
                tratamientos.length;

              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    tab === t.id
                      ? "border-green-600 text-green-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      tab === t.id ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Tab: Vacunas ─────────────────────────────────────────────── */}
          {tab === "vacunas" && (
            <div className="space-y-4">
              {/* Formulario */}
              <div className="card">
                <h3 className="subtitle mb-4">Registrar vacuna</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="input" placeholder="Nombre vacuna *" value={vacunaForm.nombre_vacuna}
                    onChange={(e) => setVacunaForm({ ...vacunaForm, nombre_vacuna: e.target.value })} />
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Fecha de aplicación *</label>
                    <input type="date" className="input" value={vacunaForm.fecha_aplicacion}
                      onChange={(e) => setVacunaForm({ ...vacunaForm, fecha_aplicacion: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Próxima dosis</label>
                    <input type="date" className="input" value={vacunaForm.proxima_dosis}
                      onChange={(e) => setVacunaForm({ ...vacunaForm, proxima_dosis: e.target.value })} />
                  </div>
                  <textarea className="input" placeholder="Observaciones" value={vacunaForm.observaciones}
                    onChange={(e) => setVacunaForm({ ...vacunaForm, observaciones: e.target.value })} />
                </div>
                <button onClick={crearVacuna} disabled={guardando} className="btn-primary mt-4">
                  {guardando ? "Guardando..." : "Guardar vacuna"}
                </button>
              </div>

              {/* Lista */}
              {vacunas.length === 0 ? (
                <div className="card text-center py-8"><p className="text-muted">Sin vacunas registradas.</p></div>
              ) : (
                <div className="space-y-2">
                  {vacunas.map((v) => (
                    <div key={v.id} className="card">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{v.nombre_vacuna}</p>
                            {v.proxima_dosis && vacunaVencida(v.proxima_dosis) && (
                              <span className="badge-red">Vencida</span>
                            )}
                          </div>
                          <p className="text-muted">Aplicada: {v.fecha_aplicacion}</p>
                          {v.proxima_dosis && (
                            <p className={`text-sm font-medium ${vacunaVencida(v.proxima_dosis) ? "text-red-600" : "text-orange-600"}`}>
                              Próxima: {v.proxima_dosis}
                            </p>
                          )}
                          {v.observaciones && <p className="text-muted mt-1">{v.observaciones}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => iniciarEdicionVacuna(v)} className="btn-secondary">
                            Editar
                          </button>
                          <button onClick={() => { setVacunaAEliminar(v.id); setConfirmOpen(true); }} className="btn-danger">
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {/* Formulario inline de edición */}
                      {vacunaEditando === v.id && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Editar vacuna</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              className="input"
                              placeholder="Nombre vacuna *"
                              value={vacunaEditForm.nombre_vacuna}
                              onChange={(e) => setVacunaEditForm({ ...vacunaEditForm, nombre_vacuna: e.target.value })}
                            />
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Fecha de aplicación *</label>
                              <input
                                type="date"
                                className="input"
                                value={vacunaEditForm.fecha_aplicacion}
                                onChange={(e) => setVacunaEditForm({ ...vacunaEditForm, fecha_aplicacion: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Próxima dosis</label>
                              <input
                                type="date"
                                className="input"
                                value={vacunaEditForm.proxima_dosis}
                                onChange={(e) => setVacunaEditForm({ ...vacunaEditForm, proxima_dosis: e.target.value })}
                              />
                            </div>
                            <textarea
                              className="input"
                              placeholder="Observaciones"
                              value={vacunaEditForm.observaciones}
                              onChange={(e) => setVacunaEditForm({ ...vacunaEditForm, observaciones: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => editarVacuna(v.id)} className="btn-primary">
                              Guardar cambios
                            </button>
                            <button onClick={() => setVacunaEditando(null)} className="btn-secondary">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Fichas ──────────────────────────────────────────────── */}
          {tab === "fichas" && (
            <div className="space-y-2">
              {fichas.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted mb-3">Sin fichas clínicas.</p>
                  <Link href={`/fichas/nueva?paciente=${pacienteId}`} className="btn-primary">
                    Crear primera ficha
                  </Link>
                </div>
              ) : (
                fichas.map((f) => (
                  <Link
                    key={f.id}
                    href={`/fichas/${f.id}`}
                    className="card flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="text-muted">{formatFechaHora(f.fecha)}</p>
                      <p className="font-semibold text-slate-900 mt-0.5">{f.motivo_consulta}</p>
                      {f.diagnostico && <p className="text-muted mt-0.5">Dx: {f.diagnostico}</p>}
                    </div>
                    <span className="text-slate-400 shrink-0">→</span>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* ── Tab: Citas ───────────────────────────────────────────────── */}
          {tab === "citas" && (
            <div className="space-y-2">
              {citas.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted">Sin citas registradas.</p>
                </div>
              ) : (
                citas.map((c) => (
                  <div key={c.id} className="card flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={ESTADO_BADGE[c.estado] ?? "badge-slate"}>
                          {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                        </span>
                        <p className="text-muted">{formatFechaHora(c.fecha_hora)}</p>
                      </div>
                      <p className="font-semibold text-slate-900">{c.motivo}</p>
                    </div>
                    {c.estado === "pendiente" && (
                      <Link
                        href={`/fichas/nueva?paciente=${pacienteId}&cita=${c.id}`}
                        className="btn-primary shrink-0"
                      >
                        Atender
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Tab: Tratamientos ────────────────────────────────────────── */}
          {tab === "tratamientos" && (
            <div className="space-y-2">
              {tratamientos.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted mb-3">Sin tratamientos registrados.</p>
                  <Link href={`/tratamientos/nuevo?paciente=${pacienteId}`} className="btn-primary">
                    Agregar tratamiento
                  </Link>
                </div>
              ) : (
                tratamientos.map((t) => {
                  const activo = !t.fecha_fin || new Date(t.fecha_fin) >= new Date();
                  return (
                    <div key={t.id} className="card">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{t.medicamento}</p>
                            {activo && <span className="badge-green">Activo</span>}
                          </div>
                          <p className="text-muted">{t.dosis} · {t.frecuencia}</p>
                          <p className="text-muted">
                            {t.fecha_inicio} → {t.fecha_fin ?? "indefinido"}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => iniciarEdicionTratamiento(t)} className="btn-secondary">
                            Editar
                          </button>
                          <button onClick={() => { setTratamientoAEliminar(t.id); setConfirmTratamiento(true); }} className="btn-danger">
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {/* Formulario inline de edición */}
                      {tratamientoEditando === t.id && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Editar tratamiento</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              className="input"
                              placeholder="Medicamento *"
                              value={tratamientoEditForm.medicamento}
                              onChange={(e) => setTratamientoEditForm({ ...tratamientoEditForm, medicamento: e.target.value })}
                            />
                            <input
                              className="input"
                              placeholder="Dosis *"
                              value={tratamientoEditForm.dosis}
                              onChange={(e) => setTratamientoEditForm({ ...tratamientoEditForm, dosis: e.target.value })}
                            />
                            <input
                              className="input"
                              placeholder="Frecuencia *"
                              value={tratamientoEditForm.frecuencia}
                              onChange={(e) => setTratamientoEditForm({ ...tratamientoEditForm, frecuencia: e.target.value })}
                            />
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Fecha inicio *</label>
                              <input
                                type="date"
                                className="input"
                                value={tratamientoEditForm.fecha_inicio}
                                onChange={(e) => setTratamientoEditForm({ ...tratamientoEditForm, fecha_inicio: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Fecha fin</label>
                              <input
                                type="date"
                                className="input"
                                value={tratamientoEditForm.fecha_fin}
                                onChange={(e) => setTratamientoEditForm({ ...tratamientoEditForm, fecha_fin: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => editarTratamiento(t.id)} className="btn-primary">
                              Guardar cambios
                            </button>
                            <button onClick={() => setTratamientoEditando(null)} className="btn-secondary">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar vacuna"
        message="¿Estás seguro de que quieres eliminar esta vacuna?"
        confirmLabel="Eliminar"
        danger
        onConfirm={eliminarVacuna}
        onCancel={() => { setConfirmOpen(false); setVacunaAEliminar(null); }}
      />

      <ConfirmDialog
        open={confirmTratamiento}
        title="Eliminar tratamiento"
        message="¿Estás seguro de que quieres eliminar este tratamiento?"
        confirmLabel="Eliminar"
        danger
        onConfirm={eliminarTratamiento}
        onCancel={() => { setConfirmTratamiento(false); setTratamientoAEliminar(null); }}
      />
    </main>
  );
}
