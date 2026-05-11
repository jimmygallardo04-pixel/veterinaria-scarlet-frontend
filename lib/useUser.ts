"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { clearSession } from "./session";
import type { Usuario } from "./types";

// Re-exportar para compatibilidad con imports existentes
export type { Usuario };

const USER_CACHE_KEY = "user_me";

/**
 * Hook que carga el usuario autenticado desde /me/.
 * Cachea el resultado en sessionStorage para no repetir la llamada
 * en cada navegación.
 */
export function useUser() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentar desde caché primero
    const cached = sessionStorage.getItem(USER_CACHE_KEY);
    if (cached) {
      try {
        setUser(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem(USER_CACHE_KEY);
      }
    }

    apiFetch("/me/")
      .then(async (res) => {
        if (!res.ok) return;
        const data: Usuario = await res.json();
        sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));
        setUser(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /**
   * Limpia el usuario del estado y la sesión completa (tokens + caché).
   * Usar en logout para garantizar que no queden tokens huérfanos.
   */
  const clearUser = () => {
    clearSession();
    setUser(null);
  };

  return { user, loading, clearUser };
}
