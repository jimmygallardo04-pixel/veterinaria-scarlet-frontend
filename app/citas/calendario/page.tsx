"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { toast } from "sonner";
import { apiFetch, swrFetcher } from "@/lib/api";
import BackButton from "@/app/components/BackButton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import VacunaDetailModal from "@/app/components/modals/VacunaDetailModal";
import TratamientoDetailModal from "@/app/components/modals/TratamientoDetailModal";

const localizer = dayjsLocalizer(dayjs);
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

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
  uuid: string;
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
  const { data: citasData, mutate: mutateCitas, isLoading: isLoadingCitas } = useSWR<{ results: Cita[] }>("/citas/?page_size=500", swrFetcher);
  const { data: vacunasData, isLoading: isLoadingVacunas } = useSWR<{ results: Vacuna[] }>("/vacunas/?page_size=500", swrFetcher);
  const { data: tratsData, isLoading: isLoadingTrats } = useSWR<{ results: Tratamiento[] }>("/tratamientos/?page_size=500", swrFetcher);
  const { data: pacientesData, isLoading: isLoadingPacs } = useSWR<{ results: Paciente[] }>("/pacientes/?page_size=200", swrFetcher);

  const pacientes: Paciente[] = pacientesData?.results ?? [];
  const loading = isLoadingCitas || isLoadingVacunas || isLoadingTrats || isLoadingPacs;

  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const [modalOpen, setModalOpen] = useState(false);
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState<number | null>(null);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filters, setFilters] = useState({ citas: true, vacunas: true, tratamientos: true });
  
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [vacunaSeleccionada, setVacunaSeleccionada] = useState<Vacuna | null>(null);
  const [tratamientoSeleccionado, setTratamientoSeleccionado] = useState<Tratamiento | null>(null);

  const [form, setForm] = useState({
    paciente: "",
    fecha_hora: "",
    motivo: "",
    observaciones: "",
    estado: "pendiente",
  });

  const limpiarForm = () => {
    setForm({ paciente: "", fecha_hora: "", motivo: "", observaciones: "", estado: "pendiente" });
    setCitaSeleccionadaId(null);
  };

  const events = useMemo(() => {
    if (loading) return [];
    
    const eventos: CalendarEvent[] = [];
    const citasRaw: Cita[] = citasData?.results ?? [];
    const vacunasRaw: Vacuna[] = vacunasData?.results ?? [];
    const tratsRaw: Tratamiento[] = tratsData?.results ?? [];

    citasRaw.forEach((cita) => {
      const inicio = new Date(cita.fecha_hora);
      const fin = new Date(inicio.getTime() + 30 * 60000);
      eventos.push({
        id: `cita-${cita.id}`,
        title: `${cita.paciente_nombre} - ${cita.motivo}`,
        start: inicio,
        end: fin,
        resourceType: "cita",
        cita,
      });
    });

    vacunasRaw.forEach((vacuna) => {
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

    tratsRaw.forEach((tratamiento) => {
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
      eventos.push({
        id: `tratamiento-${tratamiento.id}`,
        title: `💊 ${tratamiento.medicamento}`,
        start: inicio,
        end: fin,
        resourceType: "tratamiento",
        tratamiento,
      });
    });

    return eventos;
  }, [citasData, vacunasData, tratsData, loading]);

  const crearCita = async () => {
    if (!form.paciente || !form.fecha_hora || !form.motivo) {
      toast.warning("Completa paciente, fecha y motivo");
      return;
    }

    const pacienteSeleccionado = pacientes.find(
      (p) => p.uuid === form.paciente
    );

    if (!pacienteSeleccionado) {
      toast.error("Paciente no válido");
      return;
    }

    const fechaLocal = dayjs(form.fecha_hora).format("YYYY-MM-DDTHH:mm:ss");

    const res = await apiFetch("/citas/", {
      method: "POST",
      body: JSON.stringify({
        paciente: pacienteSeleccionado.uuid,
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
    mutateCitas();
  };

  const actualizarCita = async () => {
    if (!citaSeleccionadaId) { toast.error("No hay cita seleccionada"); return; }
    if (!form.paciente || !form.fecha_hora || !form.motivo) {
      toast.warning("Completa paciente, fecha y motivo");
      return;
    }

    const pacienteSeleccionado = pacientes.find((p) => p.uuid === form.paciente);
    if (!pacienteSeleccionado) { toast.error("Paciente no válido"); return; }

    const fechaLocal = dayjs(form.fecha_hora).format("YYYY-MM-DDTHH:mm:ss");

    const res = await apiFetch(`/citas/${citaSeleccionadaId}/`, {
      method: "PATCH",
      body: JSON.stringify({
        paciente: pacienteSeleccionado.uuid,
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
    mutateCitas();
  };

  const moverCita = async ({ event, start }: { event: CalendarEvent; start: Date | string }) => {
    if (event.resourceType !== "cita" || !event.cita) return;
    const citaId = Number(event.id.split("-")[1]);
    const fechaLocal = dayjs(start).format("YYYY-MM-DDTHH:mm:ss");
    const res = await apiFetch(`/citas/${citaId}/`, {
      method: "PATCH",
      body: JSON.stringify({ fecha_hora: fechaLocal }),
    });
    if (!res.ok) { toast.error("Error moviendo cita"); return; }
    toast.success("Cita actualizada");
    mutateCitas();
  };

  const eliminarCita = async () => {
    if (!citaSeleccionadaId) return;
    setConfirmOpen(false);

    const res = await apiFetch(`/citas/${citaSeleccionadaId}/`, { method: "DELETE" });
    if (!res.ok) { toast.error("Error eliminando cita"); return; }

    toast.success("Cita eliminada correctamente");
    setModalOpen(false);
    limpiarForm();
    mutateCitas();
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3b82f6"; // blue-500 (default cita)
    if (event.resourceType === "vacuna") {
      backgroundColor = "#10b981"; // green-500
    } else if (event.resourceType === "tratamiento") {
      backgroundColor = "#f59e0b"; // amber-500
    } else if (event.resourceType === "cita") {
      backgroundColor = event.cita?.estado === "completado" ? "#64748b"
        : event.cita?.estado === "cancelado" ? "#ef4444"
        : "#3b82f6";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

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
            onSelectSlot={(slotInfo: { start: Date; end: Date }) => {
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
            onSelectEvent={(event: CalendarEvent) => {
              if (event.resourceType === "cita" && event.cita) {
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
              } else if (event.resourceType === "vacuna" && event.vacuna) {
                setVacunaSeleccionada(event.vacuna);
                setModalDetalleAbierto(true);
              } else if (event.resourceType === "tratamiento" && event.tratamiento) {
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
          <div className="relative card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setModalOpen(false); limpiarForm(); }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
                <option key={p.uuid} value={p.uuid}>
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
                  <button onClick={() => setConfirmOpen(true)} className="btn-danger">
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
        open={confirmOpen}
        title="Eliminar cita"
        message="¿Estás seguro de que quieres eliminar esta cita?"
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={eliminarCita}
        onCancel={() => setConfirmOpen(false)}
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
