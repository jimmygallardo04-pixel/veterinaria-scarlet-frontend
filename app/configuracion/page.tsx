"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "@/lib/api";
import { useUser } from "@/lib/useUser";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import BackButton from "@/app/components/BackButton";

type Item = { id: number; uuid: string; nombre: string; activo?: boolean; };
type Veterinario = { id: number; nombre: string; email: string; rol: string; };

// ─── Mantenedor genérico de catálogos ───────────────────────────────────────
function Mantenedor({
  titulo,
  descripcion,
  endpoint,
}: {
  titulo: string;
  descripcion: string;
  endpoint: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState<Item | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(endpoint);
      if (!res.ok) { toast.error(`Error cargando ${titulo.toLowerCase()}`); return; }
      setItems(await res.json());
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const crear = async () => {
    if (!nuevoNombre.trim()) { toast.warning("Ingresa un nombre"); return; }
    try {
      setGuardando(true);
      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ nombre: nuevoNombre.trim(), activo: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.nombre?.[0] || `Error creando ${titulo.toLowerCase()}`);
        return;
      }
      toast.success(`${titulo} creado`);
      setNuevoNombre("");
      cargar();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const guardarEdicion = async (uuid: string) => {
    if (!editNombre.trim()) { toast.warning("El nombre no puede estar vacío"); return; }
    try {
      setGuardando(true);
      const res = await apiFetch(`${endpoint}${uuid}/`, {
        method: "PATCH",
        body: JSON.stringify({ nombre: editNombre.trim() }),
      });
      if (!res.ok) { toast.error("Error actualizando"); return; }
      toast.success("Actualizado correctamente");
      setEditandoId(null);
      cargar();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!itemAEliminar) return;
    setConfirmOpen(false);
    try {
      const res = await apiFetch(`${endpoint}${itemAEliminar.uuid}/`, { method: "DELETE" });
      if (!res.ok) { toast.error("Error eliminando"); return; }
      toast.success("Eliminado correctamente");
      cargar();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setItemAEliminar(null);
    }
  };

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="subtitle">{titulo}</h2>
        <p className="text-muted">{descripcion}</p>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          className="input flex-1"
          placeholder={`Nuevo ${titulo.toLowerCase()}...`}
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && crear()}
        />
        <button onClick={crear} disabled={guardando} className="btn-primary shrink-0">
          Agregar
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted text-center py-4">Sin registros aún.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              {editandoId === item.uuid ? (
                <>
                  <input
                    className="input flex-1"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && guardarEdicion(item.uuid)}
                    autoFocus
                  />
                  <button onClick={() => guardarEdicion(item.uuid)} disabled={guardando} className="btn-primary">Guardar</button>
                  <button onClick={() => setEditandoId(null)} className="btn-secondary">Cancelar</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-slate-800">{item.nombre}</span>
                  <button
                    onClick={() => { setEditandoId(item.uuid); setEditNombre(item.nombre); }}
                    className="btn-ghost text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => { setItemAEliminar(item); setConfirmOpen(true); }}
                    className="btn-danger text-xs"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Eliminar ${titulo.toLowerCase()}`}
        message="¿Estás seguro? Si hay pacientes o documentos usando este valor, podría causar problemas."
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={eliminar}
        onCancel={() => { setConfirmOpen(false); setItemAEliminar(null); }}
      />
    </div>
  );
}

const vetCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
type VetCreateValues = z.infer<typeof vetCreateSchema>;

const vetEditSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo inválido"),
  password: z.string().optional().refine(val => !val || val.length >= 8, {
    message: "Mínimo 8 caracteres",
  }),
});
type VetEditValues = z.infer<typeof vetEditSchema>;

// ─── Sección de equipo (veterinarios) ───────────────────────────────────────
function EquipoVeterinarios() {
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario de creación
  const [mostrarForm, setMostrarForm] = useState(false);
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    setError: setErrorCreate,
    formState: { errors: createErrors, isSubmitting: isSubmittingCreate },
  } = useForm<VetCreateValues>({
    resolver: zodResolver(vetCreateSchema),
  });

  // Edición inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setError: setErrorEdit,
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit },
  } = useForm<VetEditValues>({
    resolver: zodResolver(vetEditSchema),
  });

  // Confirmación de eliminación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [vetAEliminar, setVetAEliminar] = useState<Veterinario | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/veterinarios/");
      if (!res.ok) { toast.error("Error cargando el equipo"); return; }
      setVeterinarios(await res.json());
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const iniciarEdicion = (vet: Veterinario) => {
    setEditandoId(vet.id);
    resetEdit({ nombre: vet.nombre, email: vet.email, password: "" });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  const guardarEdicion = async (data: VetEditValues) => {
    if (!editandoId) return;
    try {
      const body: Record<string, string> = {
        nombre: data.nombre.trim(),
        email: data.email.trim(),
      };
      if (data.password) body.password = data.password;

      const res = await apiFetch(`/veterinarios/${editandoId}/`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Datos actualizados correctamente");
        setEditandoId(null);
        cargar();
        return;
      }

      if (res.status === 400) {
        const err = await res.json().catch(() => ({}));
        if (err.email) setErrorEdit("email", { message: Array.isArray(err.email) ? err.email[0] : err.email });
        if (err.password) setErrorEdit("password", { message: Array.isArray(err.password) ? err.password[0] : err.password });
        if (!err.email && !err.password) toast.error(err.detail || "Error al actualizar");
        return;
      }
      toast.error("Error al actualizar");
    } catch {
      toast.error("Error de conexión");
    }
  };

  const crear = async (data: VetCreateValues) => {
    try {
      const res = await apiFetch("/veterinarios/", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(`Veterinario ${data.nombre} creado correctamente`);
        resetCreate();
        setMostrarForm(false);
        cargar();
        return;
      }

      if (res.status === 400) {
        const err = await res.json().catch(() => ({}));
        if (err.email) setErrorCreate("email", { message: Array.isArray(err.email) ? err.email[0] : err.email });
        if (err.password) setErrorCreate("password", { message: Array.isArray(err.password) ? err.password[0] : err.password });
        if (!err.email && !err.password) toast.error(err.detail || "Error al crear el veterinario");
        return;
      }
      toast.error("Error al crear el veterinario");
    } catch {
      toast.error("Error de conexión");
    }
  };

  const eliminar = async () => {
    if (!vetAEliminar) return;
    setConfirmOpen(false);
    try {
      const res = await apiFetch(`/veterinarios/${vetAEliminar.id}/`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Error eliminando el veterinario");
        return;
      }
      toast.success(`${vetAEliminar.nombre} fue eliminado del equipo`);
      cargar();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setVetAEliminar(null);
    }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="subtitle">Equipo veterinario</h2>
          <p className="text-muted">Gestiona las cuentas de los veterinarios de tu clínica.</p>
        </div>
        <button
          onClick={() => { setMostrarForm((v) => !v); resetCreate(); }}
          className="btn-primary shrink-0"
        >
          {mostrarForm ? "Cancelar" : "+ Agregar veterinario"}
        </button>
      </div>

      {/* Formulario de creación */}
      {mostrarForm && (
        <form onSubmit={handleCreateSubmit(crear)} className="mb-6 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input className="input" placeholder="Ej: Dra. Ana García"
              {...registerCreate("nombre")} disabled={isSubmittingCreate} autoFocus />
            {createErrors.nombre && <p className="mt-1 text-sm text-red-600">{createErrors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input className={`input${createErrors.email ? " border-red-400 focus:ring-red-300" : ""}`}
              placeholder="vet@tuclinica.com" type="email"
              {...registerCreate("email")} disabled={isSubmittingCreate} />
            {createErrors.email && <p className="mt-1 text-sm text-red-600">{createErrors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña temporal</label>
            <input className={`input${createErrors.password ? " border-red-400 focus:ring-red-300" : ""}`}
              placeholder="Mínimo 8 caracteres" type="password"
              {...registerCreate("password")} disabled={isSubmittingCreate} />
            {createErrors.password && <p className="mt-1 text-sm text-red-600">{createErrors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmittingCreate} className="btn-primary w-full">
            {isSubmittingCreate ? "Creando cuenta..." : "Crear cuenta de veterinario"}
          </button>
        </form>
      )}

      {/* Lista de veterinarios */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
        </div>
      ) : veterinarios.length === 0 ? (
        <p className="text-muted text-center py-6">
          No hay veterinarios registrados aún. Agrega el primero con el botón de arriba.
        </p>
      ) : (
        <div className="space-y-2">
          {veterinarios.map((vet) => (
            <div key={vet.id} className="rounded-lg border border-slate-200 bg-slate-50">
              {editandoId === vet.id ? (
                /* ── Modo edición ── */
                <form onSubmit={handleEditSubmit(guardarEdicion)} className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                      <input className="input" {...registerEdit("nombre")} disabled={isSubmittingEdit} autoFocus />
                      {editErrors.nombre && <p className="mt-1 text-xs text-red-600">{editErrors.nombre.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Correo</label>
                      <input className={`input${editErrors.email ? " border-red-400" : ""}`}
                        type="email" {...registerEdit("email")} disabled={isSubmittingEdit} />
                      {editErrors.email && <p className="mt-1 text-xs text-red-600">{editErrors.email.message}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Nueva contraseña <span className="text-slate-400">(dejar vacío para no cambiar)</span>
                      </label>
                      <input className={`input${editErrors.password ? " border-red-400" : ""}`}
                        type="password" placeholder="Mínimo 8 caracteres"
                        {...registerEdit("password")} disabled={isSubmittingEdit} />
                      {editErrors.password && <p className="mt-1 text-xs text-red-600">{editErrors.password.message}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={cancelarEdicion} className="btn-secondary text-sm" disabled={isSubmittingEdit}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary text-sm" disabled={isSubmittingEdit}>
                      {isSubmittingEdit ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              ) : (
                /* ── Modo lectura ── */
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{vet.nombre || "Sin nombre"}</p>
                    <p className="text-xs text-slate-500 truncate">{vet.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium shrink-0">
                    Veterinario
                  </span>
                  <button onClick={() => iniciarEdicion(vet)} className="btn-ghost text-xs shrink-0">
                    Editar
                  </button>
                  <button onClick={() => { setVetAEliminar(vet); setConfirmOpen(true); }}
                    className="btn-danger text-xs shrink-0">
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar veterinario"
        message={`¿Eliminar la cuenta de ${vetAEliminar?.nombre || vetAEliminar?.email}? El usuario no podrá iniciar sesión.`}
        confirmLabel="Eliminar"
        danger
        requireKeyword="ELIMINAR"
        onConfirm={eliminar}
        onCancel={() => { setConfirmOpen(false); setVetAEliminar(null); }}
      />
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useUser();

  useEffect(() => {
    if (!loadingUser && user && user.rol !== "admin" && !user.is_superuser) {
      toast.error("No tienes permisos para acceder a esta sección");
      router.replace("/dashboard");
    }
  }, [user, loadingUser, router]);

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card skeleton h-40" />)}
        </div>
      </main>
    );
  }

  if (user && user.rol !== "admin" && !user.is_superuser) return null;

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="mb-2">
          <BackButton href="/dashboard" label="Volver al dashboard" />
        </div>
        <div>
          <h1 className="title">Configuración</h1>
          <p className="text-muted">
            Administra el equipo y las tablas paramétricas del sistema.
          </p>
        </div>

        {/* Equipo primero — es lo más importante */}
        <EquipoVeterinarios />

        <Mantenedor
          titulo="Especies"
          descripcion="Tipos de animales que atiende la clínica (perro, gato, conejo, etc.)"
          endpoint="/especies/"
        />

        <Mantenedor
          titulo="Sexos"
          descripcion="Opciones de sexo para los pacientes (macho, hembra, etc.)"
          endpoint="/sexos/"
        />

        <Mantenedor
          titulo="Tipos de documento"
          descripcion="Categorías para clasificar los archivos adjuntos (radiografía, examen, receta, etc.)"
          endpoint="/tipos-archivo/"
        />
      </div>
    </main>
  );
}
