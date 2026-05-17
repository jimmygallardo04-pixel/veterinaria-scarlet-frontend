"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type UseConfirmDeleteResult = {
  confirmOpen: boolean;
  idToDelete: string | null;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
};

/**
 * Hook para el patrón confirm → delete que se repite en todas las páginas CRUD.
 *
 * @param endpoint  Función que recibe el uuid y devuelve la URL del recurso.
 *                  Ejemplo: (uuid) => `/tutores/${uuid}/`
 * @param onSuccess Callback ejecutado tras eliminar con éxito (p.ej. reload).
 * @param messages  Mensajes de toast personalizables.
 *
 * @example
 * const { confirmOpen, requestDelete, cancelDelete, confirmDelete } = useConfirmDelete(
 *   (uuid) => `/tutores/${uuid}/`,
 *   reload,
 *   { success: "Tutor eliminado", error: "No se pudo eliminar el tutor" }
 * );
 */
export function useConfirmDelete(
  endpoint: (id: string) => string,
  onSuccess: () => void,
  messages = { success: "Eliminado correctamente", error: "No se pudo eliminar" }
): UseConfirmDeleteResult {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const requestDelete = useCallback((id: string) => {
    setIdToDelete(id);
    setConfirmOpen(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setConfirmOpen(false);
    setIdToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!idToDelete) return;
    setConfirmOpen(false);

    try {
      const res = await apiFetch(endpoint(idToDelete), { method: "DELETE" });
      if (!res.ok) {
        toast.error(messages.error);
        return;
      }
      toast.success(messages.success);
      onSuccess();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIdToDelete(null);
    }
  }, [idToDelete, endpoint, messages, onSuccess]);

  return { confirmOpen, idToDelete, requestDelete, cancelDelete, confirmDelete };
}
