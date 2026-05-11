/**
 * Constantes del dominio compartidas en todo el frontend.
 *
 * Centralizar aquí evita strings hardcodeados dispersos en múltiples archivos.
 * Un cambio de ruta o etiqueta solo requiere modificar este archivo.
 */

import type { EstadoCita } from "@/lib/types";

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

// ─── Paginación ───────────────────────────────────────────────────────────────

/** Tamaño de página por defecto para dropdowns y selectores. */
export const DROPDOWN_PAGE_SIZE = 100;

/** Número máximo de sugerencias en el buscador global. */
export const SEARCH_SUGGESTIONS_LIMIT = 8;

/** Milisegundos de debounce para el buscador global. */
export const SEARCH_DEBOUNCE_MS = 300;
