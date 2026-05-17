"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { swrFetcher, type PaginatedResponse } from "@/lib/api";

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
 * Hook genérico para cargar listas paginadas desde la API usando SWR.
 */
export function usePaginatedFetch<T>(
  endpoint: string,
  errorMessage = "Error cargando datos",
  params: Record<string, string> = {}
): UsePaginatedFetchResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  // Serializar params para detectar cambios
  const paramsKey = JSON.stringify(params);
  const prevParamsKey = useRef(paramsKey);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    if (prevParamsKey.current !== paramsKey) {
      prevParamsKey.current = paramsKey;
      setCurrentPage(1);
    }
  }, [paramsKey]);

  // Construir query string
  const query = new URLSearchParams({ page: String(currentPage), ...params });
  const url = `${endpoint}?${query.toString()}`;

  const { data, isLoading, isValidating, mutate } = useSWR<PaginatedResponse<T>>(
    url,
    swrFetcher,
    {
      onError: () => toast.error(errorMessage),
      revalidateOnFocus: true,
    }
  );

  const setPage = useCallback((page: number) => {
    const safePage = Number.isInteger(page) && page >= 1 ? page : 1;
    setCurrentPage(safePage);
  }, []);

  const pagination: PaginationState = useMemo(() => ({
    currentPage,
    totalCount: data?.count ?? 0,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  }), [data, currentPage]);

  const reload = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    items: data?.results ?? [],
    loading: isLoading || (isValidating && !data),
    pagination,
    setPage,
    reload,
  };
}
