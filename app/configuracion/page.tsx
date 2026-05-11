"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useUser } from "@/lib/useUser";
import ConfirmDialog from "@/app/components/ConfirmDialog";

type Item = { id: number; nombre: string; activo?: boolean; };
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
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState<number | null>(null);

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

  const guardarEdicion = async (id: number) => {
    if (!editNombre.trim()) { toast.warning("El nombre no puede estar vacío"); return; }
    try {
      setGuardando(true);
      const res = await apiFetch(`${endpoint}${id}/`, {
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
      const res = await apiFetch(`${endpoint}${itemAEliminar}/`, { method: "DELETE" });
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
              {editandoId === item.id ? (
                <>
                  <input
                    className="input flex-1"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && guardarEdicion(item.id)}
                    autoFocus
                  />
                  <button onClick={() => guardarEdicion(item.id)} disabled={guardando} className="btn-primary">Guardar</button>
                  <button onClick={() => setEditandoId(null)} className="btn-secondary">Cancelar</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-slate-800">{item.nombre}</span>
                  <button
                    onClick={() => { setEditandoId(item.id); setEditNombre(item.nombre); }}
                    className="btn-ghost text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => { setItemAEliminar(item.id); setConfirmOpen(true); }}
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
        onConfirm={eliminar}
        onCancel={() => { setConfirmOpen(false); setItemAEliminar(null); }}
      />
    </div>
  );
}

// ─── Sección de equipo (veterinarios) ───────────────────────────────────────
function EquipoVeterinarios() {
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Formulario de creación
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Edición inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", email: "", password: "" });
  const [editErrors, setEditErrors] = useState<{ email?: string; password?: string }>({});

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "email" || name === "password") setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (name === "email" || name === "password") setEditErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const iniciarEdicion = (vet: Veterinario) => {
    setEditandoId(vet.id);
    setEditForm({ nombre: vet.nombre, email: vet.email, password: "" });
    setEditErrors({});
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditErrors({});
  };

  const guardarEdicion = async (id: number) => {
    if (!editForm.nombre.trim() || !editForm.email.trim()) {
      toast.warning("Nombre y correo son obligatorios");
      return;
    }
    try {
      setGuardando(true);
      setEditErrors({});
      const body: Record<string, string> = {
        nombre: editForm.nombre.trim(),
        email: editForm.email.trim(),
      };
      if (editForm.password) body.password = editForm.password;

      const res = await apiFetch(`/veterinarios/${id}/`, {
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
        const newErrors: typeof editErrors = {};
        if (err.email) newErrors.email = Array.isArray(err.email) ? err.email[0] : err.email;
        if (err.password) newErrors.password = Array.isArray(err.password) ? err.password[0] : err.password;
        if (Object.keys(newErrors).length > 0) { setEditErrors(newErrors); return; }
        toast.error(err.detail || "Error al actualizar");
        return;
      }
      toast.error("Error al actualizar");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.password) {
      toast.warning("Completa todos los campos");
      return;
    }
    try {
      setGuardando(true);
      setErrors({});
      const res = await apiFetch("/veterinarios/", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(`Veterinario ${form.nombre} creado correctamente`);
        setForm({ nombre: "", email: "", password: "" });
        setMostrarForm(false);
        cargar();
        return;
      }

      if (res.status === 400) {
        const err = await res.json().catch(() => ({}));
        const newErrors: typeof errors = {};
        if (err.email) newErrors.email = Array.isArray(err.email) ? err.email[0] : err.email;
        if (err.password) newErrors.password = Array.isArray(err.password) ? err.password[0] : err.password;
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        toast.error(err.detail || "Error al crear el veterinario");
        return;
      }
      toast.error("Error al crear el veterinario");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
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
          onClick={() => { setMostrarForm((v) => !v); setErrors({}); }}
          className="btn-primary shrink-0"
        >
          {mostrarForm ? "Cancelar" : "+ Agregar veterinario"}
        </button>
      </div>

      {/* Formulario de creación */}
      {mostrarForm && (
        <form onSubmit={crear} className="mb-6 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input className="input" placeholder="Ej: Dra. Ana García" name="nombre"
              value={form.nombre} onChange={handleChange} disabled={guardando} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input className={`input${errors.email ? " border-red-400 focus:ring-red-300" : ""}`}
              placeholder="vet@tuclinica.com" type="email" name="email"
              value={form.email} onChange={handleChange} disabled={guardando} />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña temporal</label>
            <input className={`input${errors.password ? " border-red-400 focus:ring-red-300" : ""}`}
              placeholder="Mínimo 8 caracteres" type="password" name="password"
              value={form.password} onChange={handleChange} disabled={guardando} />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>
          <button type="submit" disabled={guardando} className="btn-primary w-full">
            {guardando ? "Creando cuenta..." : "Crear cuenta de veterinario"}
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
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                      <input className="input" name="nombre" value={editForm.nombre}
                        onChange={handleEditChange} disabled={guardando} autoFocus />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Correo</label>
                      <input className={`input${editErrors.email ? " border-red-400" : ""}`}
                        type="email" name="email" value={editForm.email}
                        onChange={handleEditChange} disabled={guardando} />
                      {editErrors.email && <p className="mt-1 text-xs text-red-600">{editErrors.email}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Nueva contraseña <span className="text-slate-400">(dejar vacío para no cambiar)</span>
                      </label>
                      <input className={`input${editErrors.password ? " border-red-400" : ""}`}
                        type="password" name="password" placeholder="Mínimo 8 caracteres"
                        value={editForm.password} onChange={handleEditChange} disabled={guardando} />
                      {editErrors.password && <p className="mt-1 text-xs text-red-600">{editErrors.password}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={cancelarEdicion} className="btn-secondary text-sm" disabled={guardando}>
                      Cancelar
                    </button>
                    <button onClick={() => guardarEdicion(vet.id)} className="btn-primary text-sm" disabled={guardando}>
                      {guardando ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </div>
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
