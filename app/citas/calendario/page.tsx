"use client";

import { useEffect, useState } from "react";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import BackButton from "@/app/components/BackButton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import VacunaDetailModal from "@/app/components/modals/VacunaDetailModal";
import TratamientoDetailModal from "@/app/components/modals/TratamientoDetailModal";

const localizer = dayjsLocalizer(dayjs);
const DnDCalendar = withDragAndDrop<CalendarEvent, object>(
  Calendar as any
) as any;

type Cita = {
  id: number;
  paciente: number;
  tutor: number;
  paciente_nombre: string;
  tutor_nombre: string;
  fecha_hora: string;
  motivo: string;
  observaciones?: string;
  estado: string;
};

type Vacuna = {
  id: number;
  paciente: number;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis?: string;
  observaciones?: string;
};

type Tratamiento = {
  id: number;
  paciente: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin?: string;
  indicaciones?: string;
  observaciones?: string;
};

type Paciente = {
  id: number;
  nombre: string;
  tutor: number;
  tutor_nombre: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceType: "cita" | "vacuna" | "tratamiento";
  cita?: Cita;
  vacuna?: Vacuna;
  tratamiento?: Tratamiento;
};

type CalendarView = "month" | "week" | "day" | "agenda";

export default function CalendarioCitasPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState<number | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState(false);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>("month");

  const [filters, setFilters] = useState({
    citas: true,
    vacunas: true,
    tratamientos: true,
  });

  const [vacunaSeleccionada, setVacunaSeleccionada] = useState<Vacuna | null>(null);
  const [tratamientoSeleccionado, setTratamientoSeleccionado] = useState<Tratamiento | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const [form, setForm] = useState({
    paciente: "",
    fecha_hora: "",
    motivo: "",
    observaciones: "",
    estado: "pendiente",
  });

  const limpiarForm = () => {
    setForm({
      paciente: "",
      fecha_hora: "",
      motivo: "",
      observaciones: "",
      estado: "pendiente",
    });

    setModoEdicion(false);
    setCitaSeleccionadaId(null);
  };

  const haySolape = (evento: CalendarEvent) => {
    return events.some((otro) => {
      if (otro.id === evento.id) return false;
      return evento.start < otro.end && evento.end > otro.start;
    });
  };

  const getVacunaEstado = (vacuna: Vacuna): "aplicada" | "proxima" | "vencida" => {
    if (!vacuna.proxima_dosis) return "aplicada";
    const hoy = new Date().toISOString().split("T")[0];
    return vacuna.proxima_dosis < hoy ? "vencida" : "proxima";
  };

  const getTratamientoEstado = (tratamiento: Tratamiento): "futuro" | "activo" | "finalizado" => {
    const hoy = new Date().toISOString().split("T")[0];
    if (tratamiento.fecha_inicio > hoy) return "futuro";
    if (!tratamiento.fecha_fin || tratamiento.fecha_fin >= hoy) return "activo";
    return "finalizado";
  };

  const eventStyleGetter = (evento: CalendarEvent) => {
    const solapado = haySolape(evento);
    let backgroundColor = "#22c55e";
    let borderColor = "#16a34a";

    if (evento.resourceType === "cita") {
      const estado = evento.cita?.estado;
      if (estado === "completada") {
        backgroundColor = "#2563eb";
        borderColor = "#1d4ed8";
      } else if (estado === "cancelada") {
        backgroundColor = "#64748b";
        borderColor = "#475569";
      } else {
        backgroundColor = "#22c55e";
        borderColor = "#16a34a";
      }
    } else if (evento.resourceType === "vacuna") {
      const estado = getVacunaEstado(evento.vacuna!);
      if (estado === "vencida") {
        backgroundColor = "#ef4444";
        borderColor = "#dc2626";
      } else if (estado === "proxima") {
        backgroundColor = "#f59e0b";
        borderColor = "#d97706";
      } else {
        backgroundColor = "#9333ea";
        borderColor = "#7e22ce";
      }
    } else if (evento.resourceType === "tratamiento") {
      const estado = getTratamientoEstado(evento.tratamiento!);
      if (estado === "futuro") {
        backgroundColor = "#3b82f6";
        borderColor = "#2563eb";
      } else if (estado === "finalizado") {
        backgroundColor = "#94a3b8";
        borderColor = "#64748b";
      } else {
        backgroundColor = "#06b6d4";
        borderColor = "#0891b2";
      }
    }

    if (solapado && evento.resourceType === "cita") {
      backgroundColor = "#f97316";
      borderColor = "#ea580c";
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: "white",
        borderRadius: "8px",
        padding: "2px 6px",
      },
    };
  };

  const cargarCitas = async () => {
    const res = await apiFetch("/citas/?page_size=500");
    if (!res.ok) { toast.error("Error cargando citas"); return []; }

    const json = await res.json();
    const data: Cita[] = json.results ?? json;
    return data.map((cita) => {
      const inicio = new Date(cita.fecha_hora);
      const fin = new Date(inicio.getTime() + 30 * 60000);
      return {
        id: `cita-${cita.id}`,
        title: `${cita.paciente_nombre} - ${cita.motivo}`,
        start: inicio,
        end: fin,
        resourceType: "cita" as const,
        cita,
      };
    });
  };

  const cargarVacunas = async () => {
    const res = await apiFetch("/vacunas/?page_size=500");
    if (!res.ok) { toast.error("Error cargando vacunas"); return []; }

    const json = await res.json();
    const data: Vacuna[] = json.results ?? json;
    const eventos: CalendarEvent[] = [];

    data.forEach((vacuna) => {
      const fecha = new Date(vacuna.fecha_aplicacion);
      fecha.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);

      eventos.push({
        id: `vacuna-${vacuna.id}`,
        title: `💉 ${vacuna.nombre_vacuna}`,
        start: fecha,
        end: fin,
        resourceType: "vacuna",
        vacuna,
      });

      if (vacuna.proxima_dosis) {
        const proximaFecha = new Date(vacuna.proxima_dosis);
        proximaFecha.setHours(0, 0, 0, 0);
        const proximaFin = new Date(proximaFecha);
        proximaFin.setHours(23, 59, 59, 999);

        eventos.push({
          id: `vacuna-${vacuna.id}-proxima`,
          title: `💉 Próxima dosis: ${vacuna.nombre_vacuna}`,
          start: proximaFecha,
          end: proximaFin,
          resourceType: "vacuna",
          vacuna,
        });
      }
    });

    return eventos;
  };

  const cargarTratamientos = async () => {
    const res = await apiFetch("/tratamientos/?page_size=500");
    if (!res.ok) { toast.error("Error cargando tratamientos"); return []; }

    const json = await res.json();
    const data: Tratamiento[] = json.results ?? json;
    return data.map((tratamiento) => {
      const inicio = new Date(tratamiento.fecha_inicio);
      inicio.setHours(0, 0, 0, 0);

      let fin: Date;
      if (tratamiento.fecha_fin) {
        fin = new Date(tratamiento.fecha_fin);
        fin.setHours(23, 59, 59, 999);
      } else {
        fin = new Date();
        fin.setHours(23, 59, 59, 999);
      }

      return {
        id: `tratamiento-${tratamiento.id}`,
        title: `💊 ${tratamiento.medicamento}`,
        start: inicio,
        end: fin,
        resourceType: "tratamiento" as const,
        tratamiento,
      };
    });
  };

  const cargarPacientes = async () => {
    const res = await apiFetch("/pacientes/?page_size=200");
    if (!res.ok) { toast.error("Error cargando pacientes"); return; }
    const d = await res.json();
    setPacientes(d.results ?? d);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [citas, vacunas, tratamientos] = await Promise.all([
        cargarCitas(),
        cargarVacunas(),
        cargarTratamientos(),
      ]);
      setEvents([...citas, ...vacunas, ...tratamientos]);
      await cargarPacientes();
    } catch {
      toast.error("Error cargando calendario");
    } finally {
      setLoading(false);
    }
  };

  const crearCita = async () => {
    if (!form.paciente || !form.fecha_hora || !form.motivo) {
      toast.warning("Completa paciente, fecha y motivo");
      return;
    }

    const pacienteSeleccionado = pacientes.find(
      (p) => p.id === Number(form.paciente)
    );

    if (!pacienteSeleccionado) {
      toast.error("Paciente no válido");
      return;
    }

    const fechaLocal = dayjs(form.fecha_hora).format("YYYY-MM-DDTHH:mm:ss");

    const res = await apiFetch("/citas/", {
      method: "POST",
      body: JSON.stringify({
        paciente: pacienteSeleccionado.id,
        tutor: pacienteSeleccionado.tutor,
        fecha_hora: fechaLocal,
        motivo: form.motivo,
        observaciones: form.observaciones || null,
        estado: form.estado || "pendiente",
      }),
    });

    if (!res.ok) {
      toast.error("Error creando cita");
      return;
    }

    toast.success("Cita creada correctamente");
    setModalOpen(false);
    limpiarForm();
    cargarDatos();
  };

  const actualizarCita = async () => {
    if (!citaSeleccionadaId) { toast.error("No hay cita seleccionada"); return; }
    if (!form.paciente || !form.fecha_hora || !form.motivo) {
      toast.warning("Completa paciente, fecha y motivo");
      return;
    }

    const pacienteSeleccionado = pacientes.find((p) => p.id === Number(form.paciente));
    if (!pacienteSeleccionado) { toast.error("Paciente no válido"); return; }

    const fechaLocal = dayjs(form.fecha_hora).format("YYYY-MM-DDTHH:mm:ss");

    const res = await apiFetch(`/citas/${citaSeleccionadaId}/`, {
      method: "PATCH",
      body: JSON.stringify({
        paciente: pacienteSeleccionado.id,
        tutor: pacienteSeleccionado.tutor,
        fecha_hora: fechaLocal,
        motivo: form.motivo,
        observaciones: form.observaciones || null,
        estado: form.estado,
      }),
    });

    if (!res.ok) { toast.error("Error actualizando cita"); return; }

    toast.success("Cita actualizada correctamente");
    setModalOpen(false);
    limpiarForm();
    cargarDatos();
  };

  const moverCita = async ({ event, start }: any) => {
    if (event.resourceType !== "cita") return;
    const citaId = Number(event.id.split("-")[1]);
    const fechaLocal = dayjs(start).format("YYYY-MM-DDTHH:mm:ss");
    const res = await apiFetch(`/citas/${citaId}/`, {
      method: "PATCH",
      body: JSON.stringify({ fecha_hora: fechaLocal }),
    });
    if (!res.ok) { toast.error("Error moviendo cita"); return; }
    toast.success("Cita actualizada");
    cargarDatos();
  };

  const eliminarCita = async () => {
    if (!citaSeleccionadaId) return;
    setConfirmEliminar(false);

    const res = await apiFetch(`/citas/${citaSeleccionadaId}/`, { method: "DELETE" });
    if (!res.ok) { toast.error("Error eliminando cita"); return; }

    toast.success("Cita eliminada correctamente");
    setModalOpen(false);
    limpiarForm();
    cargarDatos();
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="skeleton h-7 w-48 mb-6" />
          <div className="card skeleton h-[600px]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="page-header">
          <div>
            <BackButton href="/citas" label="Volver a citas" />
            <h1 className="title mt-2">Agenda de citas</h1>
          </div>
        </div>

        <div className="card">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">Filtros y leyenda</h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted uppercase mb-2">Citas</p>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.citas}
                      onChange={(e) => setFilters({ ...filters, citas: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="w-3 h-3 rounded bg-green-500"></span>
                    <span className="text-sm">Pendiente</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-blue-500"></span>
                    <span className="text-sm">Completada</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-gray-500"></span>
                    <span className="text-sm">Cancelada</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-orange-500"></span>
                    <span className="text-sm">Solapada</span>
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted uppercase mb-2">Vacunas</p>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.vacunas}
                      onChange={(e) => setFilters({ ...filters, vacunas: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="w-3 h-3 rounded bg-purple-500"></span>
                    <span className="text-sm">Aplicada</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-500"></span>
                    <span className="text-sm">Próxima</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-500"></span>
                    <span className="text-sm">Vencida</span>
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted uppercase mb-2">Tratamientos</p>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.tratamientos}
                      onChange={(e) => setFilters({ ...filters, tratamientos: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="w-3 h-3 rounded bg-blue-400"></span>
                    <span className="text-sm">Futuro</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-cyan-500"></span>
                    <span className="text-sm">Activo</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-slate-400"></span>
                    <span className="text-sm">Finalizado</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DnDCalendar
            localizer={localizer}
            events={events.filter((e) => {
              if (e.resourceType === "cita" && !filters.citas) return false;
              if (e.resourceType === "vacuna" && !filters.vacunas) return false;
              if (e.resourceType === "tratamiento" && !filters.tratamientos) return false;
              return true;
            })}
            startAccessor="start"
            endAccessor="end"
            date={calendarDate}
            view={calendarView}
            onNavigate={(date: Date) => setCalendarDate(date)}
            onView={(view: string) => setCalendarView(view as CalendarView)}
            views={["month", "week", "day", "agenda"]}
            eventPropGetter={eventStyleGetter}
            onEventDrop={moverCita}
            onEventResize={moverCita}
            resizable
            selectable
            onSelectSlot={(slotInfo: any) => {
              limpiarForm();

              setForm({
                paciente: "",
                fecha_hora: dayjs(slotInfo.start).format("YYYY-MM-DDTHH:mm"),
                motivo: "",
                observaciones: "",
                estado: "pendiente",
              });

              setModoEdicion(false);
              setModalOpen(true);
            }}
            onSelectEvent={(event: any) => {
              if (event.resourceType === "cita") {
                setModoEdicion(true);
                setCitaSeleccionadaId(event.cita.id);

                setForm({
                  paciente: String(event.cita.paciente),
                  fecha_hora: dayjs(event.cita.fecha_hora).format(
                    "YYYY-MM-DDTHH:mm"
                  ),
                  motivo: event.cita.motivo || "",
                  observaciones: event.cita.observaciones || "",
                  estado: event.cita.estado || "pendiente",
                });

                setModalOpen(true);
              } else if (event.resourceType === "vacuna") {
                setVacunaSeleccionada(event.vacuna);
                setModalDetalleAbierto(true);
              } else if (event.resourceType === "tratamiento") {
                setTratamientoSeleccionado(event.tratamiento);
                setModalDetalleAbierto(true);
              }
            }}
            style={{ height: 600 }}
            messages={{
              today: "Hoy",
              previous: "Anterior",
              next: "Siguiente",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
              noEventsInRange: "Sin citas",
            }}
          />
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => { setModalOpen(false); limpiarForm(); }}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="subtitle mb-4">
              {modoEdicion ? "Editar cita" : "Nueva cita"}
            </h2>

            <select
              className="input mb-3 w-full"
              value={form.paciente}
              onChange={(e) =>
                setForm({ ...form, paciente: e.target.value })
              }
            >
              <option value="">Seleccionar paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {p.tutor_nombre}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              className="input mb-3 w-full"
              value={form.fecha_hora}
              onChange={(e) =>
                setForm({ ...form, fecha_hora: e.target.value })
              }
            />

            <input
              className="input mb-3 w-full"
              placeholder="Motivo"
              value={form.motivo}
              onChange={(e) =>
                setForm({ ...form, motivo: e.target.value })
              }
            />

            <textarea
              className="input mb-3 w-full"
              placeholder="Observaciones"
              value={form.observaciones}
              onChange={(e) =>
                setForm({
                  ...form,
                  observaciones: e.target.value,
                })
              }
            />

            <select
              className="input mb-4 w-full"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>

            <div className="flex justify-between gap-2">
              <div>
                {modoEdicion && (
                  <button onClick={() => setConfirmEliminar(true)} className="btn-danger">
                    Eliminar
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setModalOpen(false); limpiarForm(); }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>

                <button
                  onClick={modoEdicion ? actualizarCita : crearCita}
                  className="btn-primary"
                >
                  {modoEdicion ? "Guardar cambios" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmEliminar}
        title="Eliminar cita"
        message="¿Estás seguro de que quieres eliminar esta cita?"
        confirmLabel="Eliminar"
        danger
        onConfirm={eliminarCita}
        onCancel={() => setConfirmEliminar(false)}
      />

      <VacunaDetailModal
        vacuna={vacunaSeleccionada}
        open={modalDetalleAbierto && !!vacunaSeleccionada}
        onClose={() => {
          setModalDetalleAbierto(false);
          setVacunaSeleccionada(null);
        }}
      />

      <TratamientoDetailModal
        tratamiento={tratamientoSeleccionado}
        open={modalDetalleAbierto && !!tratamientoSeleccionado}
        onClose={() => {
          setModalDetalleAbierto(false);
          setTratamientoSeleccionado(null);
        }}
      />
    </main>
  );
}
