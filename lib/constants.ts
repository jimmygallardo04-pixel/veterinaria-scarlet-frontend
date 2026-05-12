/**
 * Constantes del dominio compartidas en todo el frontend.
 *
 * Centralizar aquí evita strings hardcodeados dispersos en múltiples archivos.
 * Un cambio de ruta o etiqueta solo requiere modificar este archivo.
 *
 * Valores configurables via variables de entorno (con defaults):
 *   NEXT_PUBLIC_APP_NAME            → nombre de la aplicación
 *   NEXT_PUBLIC_APP_EMOJI           → emoji del logo
 *   NEXT_PUBLIC_SUPABASE_BUCKET     → nombre del bucket de Supabase
 *   NEXT_PUBLIC_DASHBOARD_CITAS_LIMIT → citas a mostrar en el dashboard
 *   NEXT_PUBLIC_SEARCH_PAGE_SIZE    → resultados del buscador global
 *   NEXT_PUBLIC_SEARCH_DEBOUNCE_MS  → debounce del buscador (ms)
 *   NEXT_PUBLIC_DROPDOWN_PAGE_SIZE  → tamaño de página para dropdowns
 *   NEXT_PUBLIC_SEARCH_SUGGESTIONS_LIMIT → sugerencias máximas en buscador
 */

import type { EstadoCita } from "@/lib/types";

// ─── Identidad de la aplicación ───────────────────────────────────────────────

/** Nombre visible de la aplicación en títulos, headers y footer. */
export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ?? "Veterinaria Scarlet";

/** Emoji del logo de la aplicación. */
export const APP_EMOJI =
  process.env.NEXT_PUBLIC_APP_EMOJI ?? "🐾";

// ─── Supabase ─────────────────────────────────────────────────────────────────

/** Nombre del bucket de Supabase Storage para documentos clínicos. */
export const SUPABASE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "documentos-veterinaria-scarlet";

// ─── Rutas de la API ──────────────────────────────────────────────────────────

export const API_ROUTES = {
  pacientes: "/pacientes/",
  tutores: "/tutores/",
  fichas: "/fichas/",
  citas: "/citas/",
  vacunas: "/vacunas/",
  tratamientos: "/tratamientos/",
  archivos: "/archivos/",
  especies: "/especies/",
  sexos: "/sexos/",
  tiposArchivo: "/tipos-archivo/",
  alertas: "/alertas/",
  me: "/me/",
  login: "/login/",
  registro: "/registro/",
  refresh: "/refresh/",
} as const;

// ─── Rutas del frontend ───────────────────────────────────────────────────────

export const APP_ROUTES = {
  dashboard: "/dashboard",
  login: "/login",
  registro: "/registro",
  pacientes: "/pacientes",
  fichas: "/fichas",
  citas: "/citas",
  citasNueva: "/citas/nueva",
  tutores: "/tutores",
  alertas: "/alertas",
  configuracion: "/configuracion",
} as const;

// ─── Estados de cita ──────────────────────────────────────────────────────────

export const ESTADO_CITA_BADGE: Record<EstadoCita, string> = {
  pendiente: "badge-yellow",
  completada: "badge-green",
  cancelada: "badge-red",
};

export const ESTADO_CITA_LABEL: Record<EstadoCita, string> = {
  pendiente: "Pendiente",
  completada: "Completada",
  cancelada: "Cancelada",
};

// ─── Paginación y búsqueda ────────────────────────────────────────────────────

/** Tamaño de página por defecto para dropdowns y selectores. */
export const DROPDOWN_PAGE_SIZE = Number(
  process.env.NEXT_PUBLIC_DROPDOWN_PAGE_SIZE ?? 100
);

/** Número máximo de sugerencias en el buscador global. */
export const SEARCH_SUGGESTIONS_LIMIT = Number(
  process.env.NEXT_PUBLIC_SEARCH_SUGGESTIONS_LIMIT ?? 8
);

/** Milisegundos de debounce para el buscador global. */
export const SEARCH_DEBOUNCE_MS = Number(
  process.env.NEXT_PUBLIC_SEARCH_DEBOUNCE_MS ?? 300
);

/** Citas pendientes a mostrar en el dashboard. */
export const DASHBOARD_CITAS_LIMIT = Number(
  process.env.NEXT_PUBLIC_DASHBOARD_CITAS_LIMIT ?? 5
);

/** page_size para la query de citas del dashboard. */
export const DASHBOARD_CITAS_PAGE_SIZE = Number(
  process.env.NEXT_PUBLIC_DASHBOARD_CITAS_PAGE_SIZE ?? 20
);
