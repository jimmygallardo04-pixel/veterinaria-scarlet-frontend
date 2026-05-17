/**
 * Barrel export de toda la librería compartida del frontend.
 *
 * Permite importar desde un solo punto en lugar de rutas largas:
 *
 *   // Antes
 *   import { apiFetch } from "@/lib/api";
 *   import type { Paciente } from "@/lib/types";
 *   import { API_ROUTES } from "@/lib/constants";
 *   import { formatFecha } from "@/lib/utils";
 *
 *   // Ahora
 *   import { apiFetch, type Paciente, API_ROUTES, formatFecha } from "@/lib";
 */

// API client
export { apiFetch } from "./api";
export type { PaginatedResponse } from "./api";

// Tipos del dominio
export type {
  Opcion,
  Tutor,
  Paciente,
  PacienteSugerencia,
  EstadoCita,
  Cita,
  FichaClinica,
  Vacuna,
  Tratamiento,
  ArchivoDocumento,
  Resumen,
  AlertasResponse,
  RolUsuario,
  Usuario,
} from "./types";

// Constantes
export {
  API_ROUTES,
  APP_ROUTES,
  ESTADO_CITA_BADGE,
  ESTADO_CITA_LABEL,
  DROPDOWN_PAGE_SIZE,
  SEARCH_SUGGESTIONS_LIMIT,
  SEARCH_DEBOUNCE_MS,
} from "./constants";

// Utilidades de fecha
export { formatFecha, formatFechaHora } from "./utils";

// Manejo de errores de API
export { handleApiError, withApiError } from "./apiError";

// Sesión JWT
export { clearSession } from "./session";

// Hooks
export { usePaginatedFetch } from "./hooks/usePaginatedFetch";
export type { PaginationState } from "./hooks/usePaginatedFetch";
export { useConfirmDelete } from "./hooks/useConfirmDelete";
export { useUser } from "./useUser";
