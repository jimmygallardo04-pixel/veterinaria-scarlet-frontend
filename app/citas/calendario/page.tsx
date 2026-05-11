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

type Paciente = {
  id: number;
  nombre: string;
  tutor: number;
  tutor_nombre: string;
};

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  cita: Cita;
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

  const eventStyleGetter = (evento: CalendarEvent) => {
    const solapado = haySolape(evento);
    const estado = evento.cita.estado;

    let backgroundColor = "#22c55e";
    let borderColor = "#16a34a";

    if (estado === "completada") {
      backgroundColor = "#2563eb";
      borderColor = "#1d4ed8";
    }

    if (estado === "cancelada") {
      backgroundColor = "#64748b";
      borderColor = "#475569";
    }

    if (solapado) {
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
    const res = await apiFetch("/citas/");
    if (!res.ok) { toast.error("Error cargando citas"); return; }

    const data: Cita[] = await res.json();
    setEvents(data.map((cita) => {
      const inicio = new Date(cita.fecha_hora);
      const fin = new Date(inicio.getTime() + 30 * 60000);
      return { id: cita.id, title: `${cita.paciente_nombre} - ${cita.motivo}`, start: inicio, end: fin, cita };
    }));
  };

  const cargarPacientes = async () => {
    const res = await apiFetch("/pacientes/");
    if (!res.ok) { toast.error("Error cargando pacientes"); return; }
    setPacientes(await res.json());
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      await Promise.all([cargarCitas(), cargarPacientes()]);
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
    cargarCitas();
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
    cargarCitas();
  };

  const moverCita = async ({ event, start }: any) => {
    const fechaLocal = dayjs(start).format("YYYY-MM-DDTHH:mm:ss");
    const res = await apiFetch(`/citas/${event.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ fecha_hora: fechaLocal }),
    });
    if (!res.ok) { toast.error("Error moviendo cita"); return; }
    toast.success("Cita actualizada");
    cargarCitas();
  };

  const eliminarCita = async () => {
    if (!citaSeleccionadaId) return;
    setConfirmEliminar(false);

    const res = await apiFetch(`/citas/${citaSeleccionadaId}/`, { method: "DELETE" });
    if (!res.ok) { toast.error("Error eliminando cita"); return; }

    toast.success("Cita eliminada correctamente");
    setModalOpen(false);
    limpiarForm();
    cargarCitas();
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
          <DnDCalendar
            localizer={localizer}
            events={events}
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
              setModoEdicion(true);
              setCitaSeleccionadaId(event.id);

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
    </main>
  );
}
