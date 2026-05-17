"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearSession, cacheUser } from "@/lib/session";
import type { Usuario } from "@/lib/types";

export interface UseAuthReturn {
  user: Usuario | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  revalidate: () => Promise<void>;
}

/**
 * Hook centralizado para autenticación.
 *
 * Proporciona:
 * - Estado de usuario y autenticación
 * - Loading mientras se valida
 * - Método logout
 * - Método revalidate para refrescar datos de usuario
 *
 * El hook es seguro contra múltiples llamadas simultáneas.
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const hasValidated = useRef(false);

  const validateSession = useCallback(async () => {
    if (hasValidated.current) {
      return;
    }

    hasValidated.current = true;

    try {
      const res = await apiFetch("/me/");

      if (res.ok) {
        const data: Usuario = await res.json();
        setUser(data);
        cacheUser(data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Error validating session in useAuth:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error calling logout endpoint:", error);
    } finally {
      clearSession();
      setUser(null);
      setIsAuthenticated(false);
      hasValidated.current = false;
      router.replace("/login");
    }
  }, [router]);

  const revalidate = useCallback(async () => {
    hasValidated.current = false;
    await validateSession();
  }, [validateSession]);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    revalidate,
  };
}
