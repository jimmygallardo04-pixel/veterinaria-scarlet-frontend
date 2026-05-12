/**
 * Tipos del dominio compartidos en todo el frontend.
 *
 * Centralizar aquí evita definiciones parciales e inconsistentes del mismo
 * concepto dispersas en cada página. Si el backend cambia un campo, solo
 * hay que actualizar este archivo.
 */

// ─── Catálogos ────────────────────────────────────────────────────────────────

export type Opcion = {
  id: number;
  nombre: string;
};

// ─── Entidades principales ────────────────────────────────────────────────────

export type Tutor = {
  id: number;
  nombre: string;
  rut?: string | null;
  telefono: string;
  email?: string | null;
  direccion?: string | null;
};

export type Paciente = {
  id: number;
  nombre: string;
  tutor: number;
  especie: number;
  sexo?: number | null;
  tutor_nombre: string;
  especie_nombre?: string | null;
  sexo_nombre?: string | null;
  raza?: string | null;
  fecha_nacimiento?: string | null;
  color?: string | null;
  esterilizado: boolean;
  observaciones?: string | null;
};

/** Versión reducida de Paciente usada en sugerencias del buscador global. */
export type PacienteSugerencia = Pick<Paciente, "id" | "nombre" | "especie_nombre" | "tutor_nombre">;

export type EstadoCita = "pendiente" | "completada" | "cancelada";

export type Cita = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  tutor_nombre: string;
  fecha_hora: string;
  motivo: string;
  estado: EstadoCita;
  observaciones?: string | null;
};

export type FichaClinica = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  fecha: string;
  motivo_consulta: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
  indicaciones?: string | null;
  observaciones?: string | null;
};

export type Vacuna = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis?: string | null;
  observaciones?: string | null;
};

export type Tratamiento = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  indicaciones?: string | null;
};

export type ArchivoDocumento = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  tipo: number;
  tipo_nombre: string;
  archivo_url: string;
  storage_path?: string | null;
  fecha: string;
  observaciones?: string | null;
};

// ─── Tipos de respuesta de la API ─────────────────────────────────────────────

export type Resumen = {
  vacunas_vencidas: number;
  vacunas_proximas: number;
  tratamientos_activos: number;
};

export type AlertasResponse = {
  fecha_revision: string;
  limite_revision: string;
  resumen: Resumen;
  vacunas_vencidas: Vacuna[];
  vacunas_proximas: Vacuna[];
  tratamientos_activos: Tratamiento[];
};

// ─── Tipos de usuario ─────────────────────────────────────────────────────────

export type RolUsuario = "admin" | "veterinario";

export type Usuario = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: RolUsuario;
  is_superuser: boolean;
};
