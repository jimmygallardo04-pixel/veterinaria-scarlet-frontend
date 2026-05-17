/**
 * Barrel export de todos los hooks personalizados.
 *
 * Uso:
 *   import { usePaginatedFetch, useConfirmDelete, useSessionInactivity } from "@/lib/hooks";
 */

export { usePaginatedFetch } from "./usePaginatedFetch";
export type { PaginationState } from "./usePaginatedFetch";

export { useConfirmDelete } from "./useConfirmDelete";

export {
  useSessionInactivity,
  DEFAULT_INACTIVITY_CONFIG,
  type SessionInactivityConfig,
} from "./useSessionInactivity";

export { useAuth } from "./useAuth";
export type { UseAuthReturn } from "./useAuth";

// Hook legacy (mantenido para compatibilidad)
export { useInactivityTimer } from "./useInactivityTimer";