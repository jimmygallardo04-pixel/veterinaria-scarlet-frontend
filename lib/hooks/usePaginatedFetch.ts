"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { apiFetch, type PaginatedResponse } from "@/lib/api";

export type PaginationState = {
  currentPage: number;
  totalCount: number;
  next: string | null;
  previous: string | null;
};

type UsePaginatedFetchResult<T> = {
  items: T[];
  loading: boolean;
  pagination: PaginationState;
  setPage: (page: number) => void;
  reload: () => void;
};

/**
 * Hook genérico para cargar listas paginadas desde la API.
 *
 * Elimina el boilerplate repetido en pacientes, tutores, fichas y citas:
 * - Estado de loading
 * - Estado de paginación (currentPage, totalCount, next, previous)
 * - Recarga automática al cambiar de página o filtros
 * - Manejo de errores con toast
 *
 * @param endpoint     Ruta base de la API, ej: "/tutores/"
 * @param errorMessage Mensaje de toast en caso de error HTTP
 * @param params       Query params adicionales (filtros). Se aplican junto con ?page=n.
 *                     Cuando cambian, la página se resetea a 1 automáticamente.
 *
 * @example
 * // Sin filtros
 * const { items, loading, pagination, setPage, reload } = usePaginatedFetch<Tutor>("/tutores/");
 *
 * // Con filtros dinámicos
 * const { items } = usePaginatedFetch<Cita>("/citas/", "Error cargando citas", { estado: "pendiente" });
 */
export function usePaginatedFetch<T>(
  endpoint: string,
  errorMessage = "Error cargando datos",
  params: Record<string, string> = {}
): UsePaginatedFetchResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalCount: 0,
    next: null,
    previous: null,
  });

  // Serializar params para detectar cambios en el useEffect
  const paramsKey = JSON.stringify(params);
  const prevParamsKey = useRef(paramsKey);

  const fetchPage = useCallback(
    async (page: number, extraParams: Record<string, string> = {}) => {
      try {
        setLoading(true);

        const query = new URLSearchParams({ page: String(page), ...extraParams });
        const res = await apiFetch(`${endpoint}?${query.toString()}`);

        if (!res.ok) {
          toast.error(errorMessage);
          return;
        }

        const data: PaginatedResponse<T> = await res.json();
        setItems(data.results);
        setPagination({
          currentPage: page,
          totalCount: data.count,
          next: data.next,
          previous: data.previous,
        });
      } catch {
        toast.error("Error de conexión");
      } finally {
        setLoading(false);
      }
    },
    [endpoint, errorMessage]
  );

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    const currentParamsKey = JSON.stringify(params);
    if (prevParamsKey.current !== currentParamsKey) {
      prevParamsKey.current = currentParamsKey;
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      return;
    }
    fetchPage(pagination.currentPage, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, paramsKey]);

  const setPage = useCallback((page: number) => {
    const safePage = Number.isInteger(page) && page >= 1 ? page : 1;
    setPagination((prev) => ({ ...prev, currentPage: safePage }));
  }, []);

  const reload = useCallback(() => {
    fetchPage(pagination.currentPage, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, pagination.currentPage, paramsKey]);

  return { items, loading, pagination, setPage, reload };
}
