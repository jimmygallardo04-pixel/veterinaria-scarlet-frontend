/**
 * Barrel export de todos los hooks personalizados.
 *
 * Uso:
 *   import { usePaginatedFetch, useConfirmDelete } from "@/lib/hooks";
 */

export { usePaginatedFetch } from "./usePaginatedFetch";
export type { PaginationState } from "./usePaginatedFetch";

export { useConfirmDelete } from "./useConfirmDelete";
