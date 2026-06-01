"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { API_ROUTES, DROPDOWN_PAGE_SIZE } from "@/lib/constants";
import type { Opcion } from "@/lib/types";
import BackButton from "@/app/components/BackButton";
import PageSkeleton from "@/app/components/PageSkeleton";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import MinimizableSection from "@/app/components/MinimizableSection";
import PacienteForm, { type PacienteFormValues } from "@/app/components/PacienteForm";
import { formatFechaHora, formatEdad, formatFecha, diasDesdeHoy } from "@/lib/utils";

function useEdadActualizada(fechaNacimiento: string | null | undefined) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!fechaNacimiento) return;
    const intervalo = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(intervalo);
  }, [fechaNacimiento]);

  return formatEdad(fechaNacimiento);
}

type Paciente = {
  id: number;
  uuid: string;
  nombre: string;
  tutor: number;
  especie: number;
  sexo: number;
  activo: boolean;
  especie_nombre?: string;
  sexo_nombre?: string;
  raza?: string | null;
  color?: string | null;
  chip?: string | null;
  fecha_nacimiento?: string | null;
  esterilizado: boolean;
  observaciones?: string | null;
  tutor_nombre: string;
  tutor_uuid: string;
};

type Vacuna = {
  id: number;
  uuid: string;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis?: string | null;
  observaciones?: string | null;
};

type Ficha = {
  id: number;
  uuid: string;
  fecha: string;
  motivo_consulta: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
};

type Cita = {
  id: number;
  uuid: string;
  fecha_hora: string;
  motivo: string;
  estado: string;
};

type Tratamiento = {
  id: number;
  uuid: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  ficha_clinica_info?: {
    id: number;
    uuid: string;
    fecha: string;
    motivo_consulta: string;
  } | null;
};

type Archivo = {
  id: number;
  uuid: string;
  tipo: number;
  tipo_nombre: string;
  archivo_url: string;
  storage_path?: string | null;
  fecha: string;
  observaciones?: string | null;
};

type TipoArchivo = { id: number; nombre: string };

type Tab = "resumen" | "vacunas" | "fichas" | "citas" | "tratamientos" | "documentos";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "resumen", label: "Resumen", icon: "🐾" },
  { id: "vacunas", label: "Vacunas", icon: "💉" },
  { id: "fichas", label: "Fichas", icon: "📋" },
  { id: "citas", label: "Citas", icon: "📅" },
  { id: "tratamientos", label: "Tratamientos", icon: "💊" },
  { id: "documentos", label: "Documentos", icon: "📄" },
];

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "badge-yellow",
  completada: "badge-green",
  cancelada: "badge-red",
};

export default function DetallePacientePage() {
  const params = useParams();
  const router = useRouter();
  const pacienteUuid = params.uuid as string;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [tiposArchivo, setTiposArchivo] = useState<TipoArchivo[]>([]);

  const [tutores, setTutores] = useState<Opcion[]>([]);
  const [especies, setEspecies] = useState<Opcion[]>([]);
  const [sexos, setSexos] = useState<Opcion[]>([]);

  const [tab, setTab] = useState<Tab>("resumen");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [editandoPaciente, setEditandoPaciente] = useState(false);
  const [confirmPacienteOpen, setConfirmPacienteOpen] = useState(false);

  const edadActualizada = useEdadActualizada(paciente?.fecha_nacimiento);

  const vacunaFormInicial = {
    nombre_vacuna: "",
    fecha_aplicacion: "",
    proxima_dosis: "",
    observaciones: "",
  };

  const [vacunaForm, setVacunaForm] = useState(vacunaFormInicial);

  const [vacunaEditando, setVacunaEditando] = useState<string | null>(null);
  const [vacunaEditForm, setVacunaEditForm] = useState({
    nombre_vacuna: "",
    fecha_aplicacion: "",
    proxima_dosis: "",
    observaciones: "",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [vacunaAEliminar, setVacunaAEliminar] = useState<string | null>(null);

  const [tratamientoEditando, setTratamientoEditando] = useState<string | null>(null);
  const [tratamientoEditForm, setTratamientoEditForm] = useState({
    medicamento: "",
    dosis: "",
    frecuencia: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  const [confirmTratamiento, setConfirmTratamiento] = useState(false);
  const [tratamientoAEliminar, setTratamientoAEliminar] = useState<string | null>(null);

  // Form nueva cita
  const citaFormInicial = {
    fecha_hora: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })(),
    motivo: "",
    observaciones: "",
    estado: "pendiente",
  };
  const [citaForm, setCitaForm] = useState(citaFormInicial);

  // Form nueva ficha
  const fichaFormInicial = {
    fecha: (() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })(),
    motivo_consulta: "",
    anamnesis: "",
    peso_kg: "",
    temperatura: "",
    frecuencia_cardiaca: "",
    frecuencia_respiratoria: "",
    diagnostico: "",
    tratamiento: "",
    indicaciones: "",
    observaciones: "",
  };
  const [fichaForm, setFichaForm] = useState(fichaFormInicial);

  // Form nuevo tratamiento
  const tratamientoFormInicial = {
    medicamento: "", dosis: "", frecuencia: "",
    fecha_inicio: "", fecha_fin: "", indicaciones: "",
  };
  const [tratamientoForm, setTratamientoForm] = useState(tratamientoFormInicial);

  // Form nuevo documento
  const BUCKET_NAME = "documentos-veterinaria-scarlet";
  const documentoFormInicial = {
    tipo: "", archivo: null as File | null,
    fecha: new Date().toISOString().slice(0, 10), observaciones: "",
  };
  const [documentoForm, setDocumentoForm] = useState(documentoFormInicial);
  const [subiendoDoc, setSubiendoDoc] = useState(false);
  const [confirmEliminarDoc, setConfirmEliminarDoc] = useState(false);
  const [docAEliminar, setDocAEliminar] = useState<string | null>(null);

  const cargarCatalogos = async () => {
    const [resTutores, resEspecies, resSexos] = await Promise.all([
      apiFetch(`${API_ROUTES.tutores}?page_size=${DROPDOWN_PAGE_SIZE}`),
      apiFetch(API_ROUTES.especies),
      apiFetch(API_ROUTES.sexos),
    ]);

    if (resTutores.ok) {
      const data = await resTutores.json();
      setTutores(data.results ?? data);
    }

    if (resEspecies.ok) {
      const data = await resEspecies.json();
      setEspecies(data.results ?? data);
    }

    if (resSexos.ok) {
      const data = await resSexos.json();
      setSexos(data.results ?? data);
    }
  };

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [resPaciente, resVacunas, resFichas, resCitas, resTratamientos, resArchivos, resTipos] =
        await Promise.all([
          apiFetch(`/pacientes/${pacienteUuid}/`),
          apiFetch(`/vacunas/?paciente=${pacienteUuid}&page_size=200`),
          apiFetch(`/fichas/?paciente=${pacienteUuid}&page_size=200`),
          apiFetch(`/citas/?paciente=${pacienteUuid}&page_size=200`),
          apiFetch(`/tratamientos/?paciente=${pacienteUuid}&page_size=200`),
          apiFetch(`/archivos/?paciente=${pacienteUuid}&page_size=200`),
          apiFetch(`/tipos-archivo/?page_size=100`),
        ]);

      if (resPaciente.ok) setPaciente(await resPaciente.json());
      if (resVacunas.ok) { const d = await resVacunas.json(); setVacunas(d.results ?? d); }
      if (resFichas.ok) { const d = await resFichas.json(); setFichas(d.results ?? d); }
      if (resCitas.ok) { const d = await resCitas.json(); setCitas(d.results ?? d); }
      if (resTratamientos.ok) { const d = await resTratamientos.json(); setTratamientos(d.results ?? d); }
      if (resArchivos.ok) { const d = await resArchivos.json(); setArchivos(d.results ?? d); }
      if (resTipos.ok) { const d = await resTipos.json(); setTiposArchivo(d.results ?? d); }
    } catch {
      toast.error("Error cargando datos del paciente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [pacienteUuid]);

  const guardarPaciente = async (data: PacienteFormValues) => {
    try {
      setGuardando(true);

      const res = await apiFetch(`/pacientes/${pacienteUuid}/`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre: data.nombre,
          especie: Number(data.especie),
          raza: data.raza || null,
          sexo: Number(data.sexo),
          fecha_nacimiento: data.fecha_nacimiento || null,
          color: data.color || null,
          esterilizado: data.esterilizado,
          chip: data.chip || null,
          observaciones: data.observaciones || null,
          tutor: Number(data.tutor),
          activo: data.activo,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo actualizar el paciente");
        return;
      }

      toast.success("Paciente actualizado");
      setEditandoPaciente(false);
      cargarTodo();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPaciente = async () => {
    setConfirmPacienteOpen(false);

    try {
      setGuardando(true);

      const res = await apiFetch(`/pacientes/${pacienteUuid}/`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("No se pudo eliminar el paciente");
        return;
      }

      toast.success("Paciente eliminado");
      router.push("/pacientes");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

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
          paciente: paciente?.id,
          nombre_vacuna: vacunaForm.nombre_vacuna,
          fecha_aplicacion: vacunaForm.fecha_aplicacion,
          proxima_dosis: vacunaForm.proxima_dosis || null,
          observaciones: vacunaForm.observaciones || null,
        }),
      });

      if (!res.ok) {
        toast.error("No se pudo registrar la vacuna");
        return;
      }

      toast.success("Vacuna registrada");
      setVacunaForm(vacunaFormInicial);

      const r = await apiFetch(`/vacunas/?paciente=${pacienteUuid}&page_size=200`);
      if (r.ok) {
        const d = await r.json();
        setVacunas(d.results ?? d);
      }
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
      setVacunas((v) => v.filter((x) => x.uuid !== vacunaAEliminar));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setVacunaAEliminar(null);
    }
  };

  const iniciarEdicionVacuna = (v: Vacuna) => {
    setVacunaEditando(v.uuid);
    setVacunaEditForm({
      nombre_vacuna: v.nombre_vacuna,
      fecha_aplicacion: v.fecha_aplicacion,
      proxima_dosis: v.proxima_dosis || "",
      observaciones: v.observaciones || "",
    });
  };

  const editarVacuna = async (uuid: string) => {
    try {
      const res = await apiFetch(`/vacunas/${uuid}/`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre_vacuna: vacunaEditForm.nombre_vacuna,
          fecha_aplicacion: vacunaEditForm.fecha_aplicacion,
          proxima_dosis: vacunaEditForm.proxima_dosis || null,
          observaciones: vacunaEditForm.observaciones || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        toast.error(`Error: ${err.detail ?? JSON.stringify(err)}`);
        return;
      }
      toast.success("Vacuna actualizada");
      setVacunaEditando(null);
      const r = await apiFetch(`/vacunas/?paciente=${pacienteUuid}&page_size=200`);
      if (r.ok) { const d = await r.json(); setVacunas(d.results ?? d); }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const vacunaVencida = (fecha: string) => new Date(fecha) < new Date();

  // ── Crear cita ────────────────────────────────────────────────────────────
  const crearCita = async () => {
    if (!citaForm.fecha_hora || !citaForm.motivo) {
      toast.warning("Fecha/hora y motivo son obligatorios");
      return;
    }
    if (!paciente) { toast.error("Paciente no cargado"); return; }
    try {
      setGuardando(true);
      const fechaISO = new Date(citaForm.fecha_hora).toISOString().replace("Z", "").slice(0, 19);
      const res = await apiFetch("/citas/", {
        method: "POST",
        body: JSON.stringify({
          paciente: paciente.id,
          tutor: paciente.tutor,
          fecha_hora: fechaISO,
          motivo: citaForm.motivo,
          observaciones: citaForm.observaciones || null,
          estado: citaForm.estado,
        }),
      });
      if (!res.ok) { toast.error("No se pudo crear la cita"); return; }
      toast.success("Cita agendada correctamente");
      setCitaForm(citaFormInicial);
      const r = await apiFetch(`/citas/?paciente=${pacienteUuid}&page_size=200`);
      if (r.ok) { const d = await r.json(); setCitas(d.results ?? d); }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // ── Crear ficha ───────────────────────────────────────────────────────────
  const crearFicha = async () => {
    if (!fichaForm.motivo_consulta) {
      toast.warning("El motivo de consulta es obligatorio");
      return;
    }
    try {
      setGuardando(true);
      const res = await apiFetch("/fichas/", {
        method: "POST",
        body: JSON.stringify({
          paciente: paciente?.id,
          fecha: new Date(fichaForm.fecha).toISOString(),
          motivo_consulta: fichaForm.motivo_consulta,
          anamnesis: fichaForm.anamnesis || null,
          peso_kg: fichaForm.peso_kg || null,
          temperatura: fichaForm.temperatura || null,
          frecuencia_cardiaca: fichaForm.frecuencia_cardiaca ? Number(fichaForm.frecuencia_cardiaca) : null,
          frecuencia_respiratoria: fichaForm.frecuencia_respiratoria ? Number(fichaForm.frecuencia_respiratoria) : null,
          diagnostico: fichaForm.diagnostico || null,
          tratamiento: fichaForm.tratamiento || null,
          indicaciones: fichaForm.indicaciones || null,
          observaciones: fichaForm.observaciones || null,
        }),
      });
      if (!res.ok) { toast.error("No se pudo crear la ficha"); return; }
      const data = await res.json();
      toast.success("Ficha creada correctamente");
      setFichaForm(fichaFormInicial);
      const r = await apiFetch(`/fichas/?paciente=${pacienteUuid}&page_size=200`);
      if (r.ok) { const d = await r.json(); setFichas(d.results ?? d); }
      // Navegar a la ficha recién creada
      router.push(`/fichas/${data.uuid}`);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // ── Crear tratamiento ─────────────────────────────────────────────────────
  const crearTratamiento = async () => {
    if (!tratamientoForm.medicamento || !tratamientoForm.dosis || !tratamientoForm.frecuencia || !tratamientoForm.fecha_inicio) {
      toast.warning("Medicamento, dosis, frecuencia y fecha de inicio son obligatorios");
      return;
    }
    try {
      setGuardando(true);
      const res = await apiFetch("/tratamientos/", {
        method: "POST",
        body: JSON.stringify({
          paciente: paciente?.id,
          medicamento: tratamientoForm.medicamento,
          dosis: tratamientoForm.dosis,
          frecuencia: tratamientoForm.frecuencia,
          fecha_inicio: tratamientoForm.fecha_inicio,
          fecha_fin: tratamientoForm.fecha_fin || null,
          indicaciones: tratamientoForm.indicaciones || null,
        }),
      });
      if (!res.ok) { toast.error("No se pudo registrar el tratamiento"); return; }
      toast.success("Tratamiento registrado");
      setTratamientoForm(tratamientoFormInicial);
      const r = await apiFetch(`/tratamientos/?paciente=${pacienteUuid}&page_size=200`);
      if (r.ok) { const d = await r.json(); setTratamientos(d.results ?? d); }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // ── Guardar documento ─────────────────────────────────────────────────────
  const guardarDocumento = async () => {
    if (!documentoForm.tipo || !documentoForm.archivo || !documentoForm.fecha) {
      toast.warning("Tipo, archivo y fecha son obligatorios");
      return;
    }
    const file = documentoForm.archivo;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Solo se permiten imágenes o PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { toast.error("Máximo 10MB"); return; }

    try {
      setSubiendoDoc(true);
      const ext = file.name.split(".").pop();
      const fileName = `paciente_${paciente?.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
      if (uploadError) { toast.error("Error subiendo archivo"); return; }
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
      const res = await apiFetch("/archivos/", {
        method: "POST",
        body: JSON.stringify({
          paciente: paciente?.id,
          tipo: Number(documentoForm.tipo),
          archivo_url: data.publicUrl,
          storage_path: fileName,
          fecha: documentoForm.fecha,
          observaciones: documentoForm.observaciones || null,
        }),
      });
      if (!res.ok) { toast.error("Error guardando documento"); return; }
      toast.success("Documento guardado");
      setDocumentoForm({ ...documentoFormInicial, fecha: new Date().toISOString().slice(0, 10) });
      const r = await apiFetch(`/archivos/?paciente=${pacienteUuid}&page_size=200`);
      if (r.ok) { const d = await r.json(); setArchivos(d.results ?? d); }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSubiendoDoc(false);
    }
  };

  // ── Eliminar documento ────────────────────────────────────────────────────
  const eliminarDocumento = async () => {
    if (!docAEliminar) return;
    setConfirmEliminarDoc(false);
    const doc = archivos.find((a) => a.uuid === docAEliminar);
    if (!doc) { setDocAEliminar(null); return; }
    try {
      if (doc.storage_path) {
        await supabase.storage.from(BUCKET_NAME).remove([doc.storage_path]);
      }
      const res = await apiFetch(`/archivos/${docAEliminar}/`, { method: "DELETE" });
      if (!res.ok) { toast.error("No se pudo eliminar el documento"); return; }
      toast.success("Documento eliminado");
      setArchivos((a) => a.filter((x) => x.uuid !== docAEliminar));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDocAEliminar(null);
    }
  };

  const iniciarEdicionTratamiento = (t: Tratamiento) => {
    setTratamientoEditando(t.uuid);
    setTratamientoEditForm({
      medicamento: t.medicamento,
      dosis: t.dosis,
      frecuencia: t.frecuencia,
      fecha_inicio: t.fecha_inicio,
      fecha_fin: t.fecha_fin || "",
    });
  };

  const editarTratamiento = async (uuid: string) => {
    try {
      const res = await apiFetch(`/tratamientos/${uuid}/`, {
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
      const r = await apiFetch(`/tratamientos/?paciente=${pacienteUuid}&page_size=200`);
      if (r.ok) { const d = await r.json(); setTratamientos(d.results ?? d); }
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
      setTratamientos((t) => t.filter((x) => x.uuid !== tratamientoAEliminar));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setTratamientoAEliminar(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="skeleton h-5 w-40 mb-6 rounded" />
          <PageSkeleton rows={4} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="page-header">
          <div>
            <BackButton href="/pacientes" label="Volver a pacientes" />
            <h1 className="title mt-2">{paciente?.nombre ?? "Paciente"}</h1>

            {paciente && (
              <p className="text-muted">
                {paciente.especie_nombre ?? "Sin especie"}
                {paciente.raza ? ` · ${paciente.raza}` : ""}
                {paciente.sexo_nombre ? ` · ${paciente.sexo_nombre}` : ""}
                {paciente.fecha_nacimiento ? ` · ${edadActualizada}` : ""}
                {paciente.chip ? ` · Chip: ${paciente.chip}` : ""}
                {" · Tutor: "}
                <Link href={`/tutores/${paciente.tutor_uuid}`} className="text-green-700 hover:underline">
                  {paciente.tutor_nombre}
                </Link>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEditandoPaciente((v) => !v)}
              className="btn-secondary"
            >
              {editandoPaciente ? "Cancelar edición" : "Editar paciente"}
            </button>

            <button
              onClick={() => setConfirmPacienteOpen(true)}
              className="btn-danger"
            >
              Eliminar paciente
            </button>
          </div>
        </div>

        {paciente && (
          <section className="card">
            <h2 className="subtitle mb-4">Datos del paciente</h2>

            {editandoPaciente ? (
              <PacienteForm
                defaultValues={{
                  nombre: paciente.nombre,
                  especie: String(paciente.especie ?? ""),
                  raza: paciente.raza ?? "",
                  sexo: String(paciente.sexo ?? ""),
                  fecha_nacimiento: paciente.fecha_nacimiento ?? "",
                  color: paciente.color ?? "",
                  tutor: String(paciente.tutor ?? ""),
                  chip: paciente.chip ?? "",
                  observaciones: paciente.observaciones ?? "",
                  esterilizado: paciente.esterilizado,
                  activo: paciente.activo,
                }}
                tutores={tutores}
                especies={especies}
                sexos={sexos}
                submitLabel="Guardar cambios"
                onCancel={() => setEditandoPaciente(false)}
                onSubmit={guardarPaciente}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-muted">Especie</p>
                    <p className="font-medium">{paciente.especie_nombre ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Raza</p>
                    <p className="font-medium">{paciente.raza ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Sexo</p>
                    <p className="font-medium">{paciente.sexo_nombre ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Edad</p>
                    <p className="font-medium">{edadActualizada ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Color</p>
                    <p className="font-medium">{paciente.color ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Chip</p>
                    <p className="font-medium">{paciente.chip ?? "-"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Esterilizado</p>
                    <p className="font-medium">{paciente.esterilizado ? "Sí" : "No"}</p>
                  </div>

                  <div>
                    <p className="text-muted">Estado</p>
                    <p className="font-medium">{paciente.activo ? "Activo" : "Inactivo"}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-muted">Tutor</p>
                    <Link
                      href={`/tutores/${paciente.tutor_uuid}`}
                      className="font-medium text-green-700 hover:underline"
                    >
                      {paciente.tutor_nombre}
                    </Link>
                  </div>
                </div>

                {paciente.observaciones && (
                  <div className="mt-4">
                    <p className="text-muted">Observaciones</p>
                    <p className="mt-1">{paciente.observaciones}</p>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {TABS.map((t) => {
              const count =
                t.id === "resumen"
                  ? 0
                  : t.id === "vacunas"
                  ? vacunas.length
                  : t.id === "fichas"
                  ? fichas.length
                  : t.id === "citas"
                  ? citas.length
                  : t.id === "tratamientos"
                  ? tratamientos.length
                  : archivos.length;

              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1 px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                    tab === t.id
                      ? "border-green-600 text-green-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="text-sm md:text-base">{t.icon}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        tab === t.id
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {tab === "resumen" && (() => {
            // ── Construir línea de tiempo ──────────────────────────────────
            type EventoTipo = "nacimiento" | "ficha" | "vacuna" | "vacuna_proxima" | "tratamiento" | "cita";
            type Evento = {
              fecha: Date;
              tipo: EventoTipo;
              titulo: string;
              subtitulo?: string;
              extra?: string;
              uuid?: string;
              estado?: string;
              vencida?: boolean;
              activo?: boolean;
            };

            const eventos: Evento[] = [];

            // Nacimiento
            if (paciente?.fecha_nacimiento) {
              eventos.push({
                fecha: new Date(paciente.fecha_nacimiento + "T00:00:00"),
                tipo: "nacimiento",
                titulo: "Nacimiento",
                subtitulo: formatFecha(paciente.fecha_nacimiento),
                extra: edadActualizada,
              });
            }

            // Fichas
            fichas.forEach((f) => {
              eventos.push({
                fecha: new Date(f.fecha),
                tipo: "ficha",
                titulo: f.motivo_consulta,
                subtitulo: formatFechaHora(f.fecha),
                extra: f.diagnostico ?? undefined,
                uuid: f.uuid,
              });
            });

            // Vacunas aplicadas
            vacunas.forEach((v) => {
              eventos.push({
                fecha: new Date(v.fecha_aplicacion + "T00:00:00"),
                tipo: "vacuna",
                titulo: v.nombre_vacuna,
                subtitulo: `Aplicada: ${formatFecha(v.fecha_aplicacion)}`,
                extra: v.observaciones ?? undefined,
                uuid: v.uuid,
              });
            });

            // Citas
            citas.forEach((c) => {
              eventos.push({
                fecha: new Date(c.fecha_hora),
                tipo: "cita",
                titulo: c.motivo,
                subtitulo: formatFechaHora(c.fecha_hora),
                uuid: c.uuid,
                estado: c.estado,
              });
            });

            // Tratamientos
            tratamientos.forEach((t) => {
              const activo = !t.fecha_fin || new Date(t.fecha_fin) >= new Date();
              eventos.push({
                fecha: new Date(t.fecha_inicio + "T00:00:00"),
                tipo: "tratamiento",
                titulo: t.medicamento,
                subtitulo: `${t.dosis} · ${t.frecuencia}`,
                extra: t.fecha_fin ? `Hasta: ${formatFecha(t.fecha_fin)}` : "Sin fecha de fin",
                uuid: t.uuid,
                activo,
              });
            });

            // Ordenar por fecha descendente (más reciente primero)
            eventos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

            // Próximas vacunas (futuras)
            const proximasVacunas = vacunas.filter(
              (v) => v.proxima_dosis && new Date(v.proxima_dosis) >= new Date()
            ).sort((a, b) =>
              new Date(a.proxima_dosis!).getTime() - new Date(b.proxima_dosis!).getTime()
            );

            // Vacunas vencidas
            const vacunasVencidas = vacunas.filter(
              (v) => v.proxima_dosis && new Date(v.proxima_dosis) < new Date()
            );

            // Tratamientos activos
            const tratamientosActivos = tratamientos.filter(
              (t) => !t.fecha_fin || new Date(t.fecha_fin) >= new Date()
            );

            // Próximas citas
            const citasPendientes = citas
              .filter((c) => c.estado === "pendiente" && new Date(c.fecha_hora) >= new Date())
              .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());

            const iconoEvento: Record<EventoTipo, string> = {
              nacimiento: "🐣",
              ficha: "📋",
              vacuna: "💉",
              vacuna_proxima: "⏰",
              tratamiento: "💊",
              cita: "📅",
            };

            const colorLinea: Record<EventoTipo, string> = {
              nacimiento: "bg-purple-500",
              ficha: "bg-green-500",
              vacuna: "bg-blue-500",
              vacuna_proxima: "bg-orange-400",
              tratamiento: "bg-yellow-500",
              cita: "bg-slate-400",
            };

            const colorCard: Record<EventoTipo, string> = {
              nacimiento: "border-l-4 border-purple-400 bg-purple-50",
              ficha: "border-l-4 border-green-400 bg-green-50",
              vacuna: "border-l-4 border-blue-400 bg-blue-50",
              vacuna_proxima: "border-l-4 border-orange-400 bg-orange-50",
              tratamiento: "border-l-4 border-yellow-400 bg-yellow-50",
              cita: "border-l-4 border-slate-300 bg-slate-50",
            };

            return (
              <div className="space-y-6">
                {/* ── Tarjetas de resumen rápido ── */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="card text-center py-4">
                    <p className="text-2xl font-bold text-green-700">{fichas.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Fichas clínicas</p>
                  </div>
                  <div className="card text-center py-4">
                    <p className="text-2xl font-bold text-blue-600">{vacunas.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Vacunas aplicadas</p>
                  </div>
                  <div className={`card text-center py-4 ${tratamientosActivos.length > 0 ? "ring-2 ring-yellow-400" : ""}`}>
                    <p className="text-2xl font-bold text-yellow-600">{tratamientosActivos.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Tratamientos activos</p>
                  </div>
                  <div className={`card text-center py-4 ${vacunasVencidas.length > 0 ? "ring-2 ring-red-400" : ""}`}>
                    <p className={`text-2xl font-bold ${vacunasVencidas.length > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {vacunasVencidas.length}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Vacunas vencidas</p>
                  </div>
                </div>

                {/* ── Alertas ── */}
                {(vacunasVencidas.length > 0 || proximasVacunas.length > 0 || tratamientosActivos.length > 0 || citasPendientes.length > 0) && (
                  <div className="space-y-2">
                    {vacunasVencidas.length > 0 && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="font-semibold text-red-700 mb-2">⚠️ Vacunas vencidas</p>
                        <ul className="space-y-1">
                          {vacunasVencidas.map((v) => (
                            <li key={v.uuid} className="text-sm text-red-600">
                              <span className="font-medium">{v.nombre_vacuna}</span>
                              {" — "}vencida el {formatFecha(v.proxima_dosis!)}
                              {" "}
                              <span className="text-xs text-red-400">
                                (hace {Math.abs(diasDesdeHoy(v.proxima_dosis) ?? 0)} días)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {proximasVacunas.length > 0 && (
                      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                        <p className="font-semibold text-orange-700 mb-2">⏰ Próximas vacunas</p>
                        <ul className="space-y-1">
                          {proximasVacunas.map((v) => (
                            <li key={v.uuid} className="text-sm text-orange-700">
                              <span className="font-medium">{v.nombre_vacuna}</span>
                              {" — "}{formatFecha(v.proxima_dosis!)}
                              {" "}
                              <span className="text-xs text-orange-500">
                                ({diasDesdeHoy(v.proxima_dosis) === 0
                                  ? "hoy"
                                  : diasDesdeHoy(v.proxima_dosis) === 1
                                  ? "mañana"
                                  : `en ${diasDesdeHoy(v.proxima_dosis)} días`})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tratamientosActivos.length > 0 && (
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                        <p className="font-semibold text-yellow-700 mb-2">💊 Tratamientos en curso</p>
                        <ul className="space-y-1">
                          {tratamientosActivos.map((t) => (
                            <li key={t.uuid} className="text-sm text-yellow-800">
                              <span className="font-medium">{t.medicamento}</span>
                              {" — "}{t.dosis} · {t.frecuencia}
                              {t.fecha_fin && (
                                <span className="text-xs text-yellow-600 ml-1">
                                  (hasta {formatFecha(t.fecha_fin)})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {citasPendientes.length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-700 mb-2">📅 Próximas citas</p>
                        <ul className="space-y-1">
                          {citasPendientes.map((c) => (
                            <li key={c.uuid} className="text-sm text-slate-700">
                              <span className="font-medium">{c.motivo}</span>
                              {" — "}{formatFechaHora(c.fecha_hora)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Línea de tiempo ── */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                    Historial cronológico
                  </h3>

                  {eventos.length === 0 ? (
                    <div className="card text-center py-10">
                      <p className="text-3xl mb-2">🐾</p>
                      <p className="text-muted">Aún no hay registros para este paciente.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Línea vertical */}
                      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

                      <div className="space-y-3">
                        {eventos.map((ev, idx) => (
                          <div key={`${ev.tipo}-${ev.uuid ?? idx}`} className="relative flex gap-4 pl-12">
                            {/* Punto en la línea */}
                            <div className={`absolute left-3.5 top-3 w-3 h-3 rounded-full ring-2 ring-white ${colorLinea[ev.tipo]}`} />

                            {/* Tarjeta del evento */}
                            <div className={`flex-1 rounded-xl p-3 ${colorCard[ev.tipo]}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-base">{iconoEvento[ev.tipo]}</span>
                                    {ev.tipo === "ficha" && ev.uuid ? (
                                      <Link
                                        href={`/fichas/${ev.uuid}`}
                                        className="font-semibold text-sm text-green-800 hover:underline truncate"
                                      >
                                        {ev.titulo}
                                      </Link>
                                    ) : (
                                      <p className="font-semibold text-sm text-slate-800 truncate">{ev.titulo}</p>
                                    )}
                                    {ev.tipo === "cita" && ev.estado && (
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        ev.estado === "completada" ? "bg-green-100 text-green-700" :
                                        ev.estado === "cancelada" ? "bg-red-100 text-red-600" :
                                        "bg-yellow-100 text-yellow-700"
                                      }`}>
                                        {ev.estado.charAt(0).toUpperCase() + ev.estado.slice(1)}
                                      </span>
                                    )}
                                    {ev.tipo === "tratamiento" && ev.activo && (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                                        Activo
                                      </span>
                                    )}
                                  </div>
                                  {ev.subtitulo && (
                                    <p className="text-xs text-slate-500 mt-0.5 ml-6">{ev.subtitulo}</p>
                                  )}
                                  {ev.extra && (
                                    <p className="text-xs text-slate-600 mt-1 ml-6 line-clamp-2">{ev.extra}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {tab === "vacunas" && (
            <div className="space-y-4">
              <MinimizableSection id="paciente-vacuna-form" title="➕ Registrar vacuna" persistent>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="input"
                    placeholder="Nombre vacuna *"
                    value={vacunaForm.nombre_vacuna}
                    onChange={(e) => setVacunaForm({ ...vacunaForm, nombre_vacuna: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Fecha de aplicación *</label>
                    <input
                      type="date"
                      className="input"
                      value={vacunaForm.fecha_aplicacion}
                      onChange={(e) => setVacunaForm({ ...vacunaForm, fecha_aplicacion: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Próxima dosis</label>
                    <input
                      type="date"
                      className="input"
                      value={vacunaForm.proxima_dosis}
                      onChange={(e) => setVacunaForm({ ...vacunaForm, proxima_dosis: e.target.value })}
                    />
                  </div>
                  <textarea
                    className="input"
                    placeholder="Observaciones"
                    value={vacunaForm.observaciones}
                    onChange={(e) => setVacunaForm({ ...vacunaForm, observaciones: e.target.value })}
                  />
                </div>
                <button onClick={crearVacuna} disabled={guardando} className="btn-primary mt-4">
                  {guardando ? "Guardando..." : "Guardar vacuna"}
                </button>
              </MinimizableSection>

              {vacunas.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted">Sin vacunas registradas.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vacunas.map((v) => (
                    <div key={v.uuid} className="card">
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
                            <p
                              className={`text-sm font-medium ${
                                vacunaVencida(v.proxima_dosis)
                                  ? "text-red-600"
                                  : "text-orange-600"
                              }`}
                            >
                              Próxima: {v.proxima_dosis}
                            </p>
                          )}

                          {v.observaciones && (
                            <p className="text-muted mt-1">{v.observaciones}</p>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => iniciarEdicionVacuna(v)} className="btn-secondary">
                            Editar
                          </button>

                          <button
                            onClick={() => {
                              setVacunaAEliminar(v.uuid);
                              setConfirmOpen(true);
                            }}
                            className="btn-danger"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {vacunaEditando === v.uuid && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">
                            Editar vacuna
                          </h4>

                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              className="input"
                              placeholder="Nombre vacuna *"
                              value={vacunaEditForm.nombre_vacuna}
                              onChange={(e) =>
                                setVacunaEditForm({
                                  ...vacunaEditForm,
                                  nombre_vacuna: e.target.value,
                                })
                              }
                            />

                            <input
                              type="date"
                              className="input"
                              value={vacunaEditForm.fecha_aplicacion}
                              onChange={(e) =>
                                setVacunaEditForm({
                                  ...vacunaEditForm,
                                  fecha_aplicacion: e.target.value,
                                })
                              }
                            />

                            <input
                              type="date"
                              className="input"
                              value={vacunaEditForm.proxima_dosis}
                              onChange={(e) =>
                                setVacunaEditForm({
                                  ...vacunaEditForm,
                                  proxima_dosis: e.target.value,
                                })
                              }
                            />

                            <textarea
                              className="input"
                              placeholder="Observaciones"
                              value={vacunaEditForm.observaciones}
                              onChange={(e) =>
                                setVacunaEditForm({
                                  ...vacunaEditForm,
                                  observaciones: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="flex gap-2 mt-3">
                            <button onClick={() => editarVacuna(v.uuid)} className="btn-primary">
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

          {tab === "fichas" && (
            <div className="space-y-4">
              <MinimizableSection id="paciente-ficha-form" title="➕ Nueva ficha clínica" persistent>
                {/* Signos vitales */}
                <div className="grid gap-3 md:grid-cols-4 mb-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Peso (kg)</label>
                    <input className="input" type="number" step="0.01" placeholder="Ej: 4.5" value={fichaForm.peso_kg} onChange={(e) => setFichaForm({ ...fichaForm, peso_kg: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Temperatura (°C)</label>
                    <input className="input" type="number" step="0.1" placeholder="Ej: 38.5" value={fichaForm.temperatura} onChange={(e) => setFichaForm({ ...fichaForm, temperatura: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Frec. cardíaca (lpm)</label>
                    <input className="input" type="number" placeholder="Ej: 80" value={fichaForm.frecuencia_cardiaca} onChange={(e) => setFichaForm({ ...fichaForm, frecuencia_cardiaca: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Frec. respiratoria (rpm)</label>
                    <input className="input" type="number" placeholder="Ej: 20" value={fichaForm.frecuencia_respiratoria} onChange={(e) => setFichaForm({ ...fichaForm, frecuencia_respiratoria: e.target.value })} />
                  </div>
                </div>
                {/* Consulta */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Fecha y hora *</label>
                    <input className="input w-full" type="datetime-local" value={fichaForm.fecha} onChange={(e) => setFichaForm({ ...fichaForm, fecha: e.target.value })} />
                  </div>
                  <input className="input w-full" placeholder="Motivo de consulta *" value={fichaForm.motivo_consulta} onChange={(e) => setFichaForm({ ...fichaForm, motivo_consulta: e.target.value })} />
                  <textarea className="input w-full" rows={2} placeholder="Anamnesis" value={fichaForm.anamnesis} onChange={(e) => setFichaForm({ ...fichaForm, anamnesis: e.target.value })} />
                  <textarea className="input w-full" rows={2} placeholder="Diagnóstico" value={fichaForm.diagnostico} onChange={(e) => setFichaForm({ ...fichaForm, diagnostico: e.target.value })} />
                  <textarea className="input w-full" rows={2} placeholder="Tratamiento" value={fichaForm.tratamiento} onChange={(e) => setFichaForm({ ...fichaForm, tratamiento: e.target.value })} />
                  <textarea className="input w-full" rows={2} placeholder="Indicaciones para el tutor" value={fichaForm.indicaciones} onChange={(e) => setFichaForm({ ...fichaForm, indicaciones: e.target.value })} />
                  <textarea className="input w-full" rows={2} placeholder="Observaciones" value={fichaForm.observaciones} onChange={(e) => setFichaForm({ ...fichaForm, observaciones: e.target.value })} />
                </div>
                <button onClick={crearFicha} disabled={guardando} className="btn-primary mt-4">
                  {guardando ? "Guardando..." : "Guardar ficha"}
                </button>
              </MinimizableSection>

              {fichas.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted">Sin fichas clínicas registradas.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fichas.map((f) => (
                    <Link
                      key={f.uuid}
                      href={`/fichas/${f.uuid}`}
                      className="card flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="text-muted">{formatFechaHora(f.fecha)}</p>
                        <p className="font-semibold text-slate-900 mt-0.5">{f.motivo_consulta}</p>
                        {f.diagnostico && <p className="text-muted mt-0.5">Dx: {f.diagnostico}</p>}
                      </div>
                      <span className="text-slate-400 shrink-0">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "citas" && (
            <div className="space-y-4">
              <MinimizableSection id="paciente-cita-form" title="➕ Agendar cita" persistent>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Fecha y hora *</label>
                    <input
                      type="datetime-local"
                      className="input w-full"
                      value={citaForm.fecha_hora}
                      onChange={(e) => setCitaForm({ ...citaForm, fecha_hora: e.target.value })}
                    />
                  </div>
                  <input
                    className="input w-full"
                    placeholder="Motivo * (ej: Control anual, vacunación...)"
                    value={citaForm.motivo}
                    onChange={(e) => setCitaForm({ ...citaForm, motivo: e.target.value })}
                  />
                  <textarea
                    className="input w-full"
                    rows={2}
                    placeholder="Observaciones"
                    value={citaForm.observaciones}
                    onChange={(e) => setCitaForm({ ...citaForm, observaciones: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Estado</label>
                    <select
                      className="input w-full"
                      value={citaForm.estado}
                      onChange={(e) => setCitaForm({ ...citaForm, estado: e.target.value })}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
                <button onClick={crearCita} disabled={guardando} className="btn-primary mt-4">
                  {guardando ? "Guardando..." : "Agendar cita"}
                </button>
              </MinimizableSection>

              {citas.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted">Sin citas registradas.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {citas.map((c) => (
                    <div key={c.uuid} className="card flex items-center justify-between gap-4">
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
                          href={`/fichas/nueva?paciente=${pacienteUuid}&cita=${c.uuid}`}
                          className="btn-primary shrink-0"
                        >
                          Atender
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "tratamientos" && (
            <div className="space-y-4">
              <MinimizableSection id="paciente-tratamiento-form" title="➕ Registrar tratamiento" persistent>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="input md:col-span-2"
                    placeholder="Medicamento *"
                    value={tratamientoForm.medicamento}
                    onChange={(e) => setTratamientoForm({ ...tratamientoForm, medicamento: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Dosis * (ej: 5mg)"
                    value={tratamientoForm.dosis}
                    onChange={(e) => setTratamientoForm({ ...tratamientoForm, dosis: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Frecuencia * (ej: cada 12h)"
                    value={tratamientoForm.frecuencia}
                    onChange={(e) => setTratamientoForm({ ...tratamientoForm, frecuencia: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Fecha de inicio *</label>
                    <input
                      type="date"
                      className="input"
                      value={tratamientoForm.fecha_inicio}
                      onChange={(e) => setTratamientoForm({ ...tratamientoForm, fecha_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Fecha de fin</label>
                    <input
                      type="date"
                      className="input"
                      value={tratamientoForm.fecha_fin}
                      onChange={(e) => setTratamientoForm({ ...tratamientoForm, fecha_fin: e.target.value })}
                    />
                  </div>
                  <textarea
                    className="input md:col-span-2"
                    placeholder="Indicaciones"
                    rows={2}
                    value={tratamientoForm.indicaciones}
                    onChange={(e) => setTratamientoForm({ ...tratamientoForm, indicaciones: e.target.value })}
                  />
                </div>
                <button onClick={crearTratamiento} disabled={guardando} className="btn-primary mt-4">
                  {guardando ? "Guardando..." : "Guardar tratamiento"}
                </button>
              </MinimizableSection>

              {tratamientos.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted">Sin tratamientos registrados.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tratamientos.map((t) => {
                    const activo = !t.fecha_fin || new Date(t.fecha_fin) >= new Date();
                    return (
                      <div key={t.uuid} className="card">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900">{t.medicamento}</p>
                              {activo && <span className="badge-green">Activo</span>}
                              {t.ficha_clinica_info && (
                                <Link href={`/fichas/${t.ficha_clinica_info.uuid}`} className="badge-blue hover:underline">
                                  Ficha {new Date(t.ficha_clinica_info.fecha).toLocaleDateString()}
                                </Link>
                              )}
                            </div>
                            <p className="text-muted">{t.dosis} · {t.frecuencia}</p>
                            <p className="text-muted">{t.fecha_inicio} → {t.fecha_fin ?? "indefinido"}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => iniciarEdicionTratamiento(t)} className="btn-secondary">Editar</button>
                            <button onClick={() => { setTratamientoAEliminar(t.uuid); setConfirmTratamiento(true); }} className="btn-danger">Eliminar</button>
                          </div>
                        </div>
                        {tratamientoEditando === t.uuid && (
                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Editar tratamiento</h4>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input className="input" placeholder="Medicamento *" value={tratamientoEditForm.medicamento} onChange={(e) => setTratamientoEditForm({ ...tratamientoEditForm, medicamento: e.target.value })} />
                              <input className="input" placeholder="Dosis *" value={tratamientoEditForm.dosis} onChange={(e) => setTratamientoEditForm({ ...tratamientoEditForm, dosis: e.target.value })} />
                              <input className="input" placeholder="Frecuencia *" value={tratamientoEditForm.frecuencia} onChange={(e) => setTratamientoEditForm({ ...tratamientoEditForm, frecuencia: e.target.value })} />
                              <input type="date" className="input" value={tratamientoEditForm.fecha_inicio} onChange={(e) => setTratamientoEditForm({ ...tratamientoEditForm, fecha_inicio: e.target.value })} />
                              <input type="date" className="input" value={tratamientoEditForm.fecha_fin} onChange={(e) => setTratamientoEditForm({ ...tratamientoEditForm, fecha_fin: e.target.value })} />
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => editarTratamiento(t.uuid)} className="btn-primary">Guardar cambios</button>
                              <button onClick={() => setTratamientoEditando(null)} className="btn-secondary">Cancelar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {tab === "documentos" && (
            <div className="space-y-4">
              <MinimizableSection id="paciente-documento-form" title="➕ Subir documento" persistent>
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    className="input"
                    value={documentoForm.tipo}
                    onChange={(e) => setDocumentoForm({ ...documentoForm, tipo: e.target.value })}
                  >
                    <option value="">Tipo de documento *</option>
                    {tiposArchivo.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Fecha *</label>
                    <input
                      type="date"
                      className="input"
                      value={documentoForm.fecha}
                      onChange={(e) => setDocumentoForm({ ...documentoForm, fecha: e.target.value })}
                    />
                  </div>
                </div>
                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:bg-white transition-colors">
                  <div className="text-2xl mb-1">📎</div>
                  <p className="text-sm font-medium text-slate-700">Arrastra o haz clic para seleccionar</p>
                  <p className="text-xs text-slate-400 mt-1">PDF o imagen · máx 10MB</p>
                  {documentoForm.archivo && (
                    <span className="mt-2 rounded-lg bg-green-100 px-3 py-1 text-sm text-green-800 font-medium">
                      ✓ {documentoForm.archivo.name}
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setDocumentoForm({ ...documentoForm, archivo: f });
                    }}
                  />
                </label>
                <textarea
                  className="input mt-3 w-full"
                  placeholder="Observaciones"
                  rows={2}
                  value={documentoForm.observaciones}
                  onChange={(e) => setDocumentoForm({ ...documentoForm, observaciones: e.target.value })}
                />
                <button onClick={guardarDocumento} disabled={subiendoDoc} className="btn-primary mt-4">
                  {subiendoDoc ? "Subiendo..." : "Guardar documento"}
                </button>
              </MinimizableSection>

              {archivos.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-muted">Sin documentos adjuntos.</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {archivos.map((a) => {
                    const url = a.archivo_url || "";
                    const esImagen = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                    const esPdf = /\.pdf$/i.test(url);
                    return (
                      <div key={a.uuid} className="card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-900 capitalize">{a.tipo_nombre || "Documento"}</p>
                            <p className="text-muted text-xs">{a.fecha}</p>
                          </div>
                          <button
                            onClick={() => { setDocAEliminar(a.uuid); setConfirmEliminarDoc(true); }}
                            className="btn-danger text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                        {esImagen && (
                          <img src={url} alt={a.tipo_nombre} className="mb-2 max-h-40 w-full rounded-lg object-cover" />
                        )}
                        {esPdf && (
                          <iframe src={url} className="mb-2 h-48 w-full rounded-lg border" title={a.tipo_nombre} />
                        )}
                        {a.observaciones && <p className="text-sm text-slate-600 mb-2">{a.observaciones}</p>}
                        <a href={url} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                          {esPdf ? "Abrir PDF" : "Ver"}
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm eliminar documento */}
      <ConfirmDialog
        open={confirmEliminarDoc}
        title="Eliminar documento"
        message="¿Estás seguro? El archivo se eliminará permanentemente."
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={eliminarDocumento}
        onCancel={() => { setConfirmEliminarDoc(false); setDocAEliminar(null); }}
      />

      {/* Confirm eliminar vacuna */}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar vacuna"
        message="¿Estás seguro de que quieres eliminar esta vacuna?"
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={eliminarVacuna}
        onCancel={() => { setConfirmOpen(false); setVacunaAEliminar(null); }}
      />

      {/* Confirm eliminar tratamiento */}
      <ConfirmDialog
        open={confirmTratamiento}
        title="Eliminar tratamiento"
        message="¿Estás seguro de que quieres eliminar este tratamiento?"
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={eliminarTratamiento}
        onCancel={() => { setConfirmTratamiento(false); setTratamientoAEliminar(null); }}
      />

      {/* Confirm eliminar paciente */}
      <ConfirmDialog
        open={confirmPacienteOpen}
        title="Eliminar paciente"
        message="¿Estás seguro? Esta acción eliminará al paciente del sistema."
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={eliminarPaciente}
        onCancel={() => setConfirmPacienteOpen(false)}
      />
    </main>
  );
}