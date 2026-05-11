/**
 * Cliente HTTP centralizado con refresh automático de JWT.
 *
 * Uso:
 *   import { apiFetch } from "@/lib/api";
 *   const res = await apiFetch("/pacientes/");
 */

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/lib/session";

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Respuesta paginada estándar del backend (DRF PageNumberPagination). */
export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helpers privados ─────────────────────────────────────────────────────────

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_URL}/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      clearSession();
      return null;
    }

    const data = await res.json();
    // Guardar el nuevo access token manteniendo el refresh existente
    saveTokens(data.access, refresh);
    return data.access;
  } catch {
    clearSession();
    return null;
  }
}

function buildHeaders(access: string | null, existingHeaders?: HeadersInit, body?: BodyInit | null): Headers {
  const headers = new Headers(existingHeaders ?? {});
  if (access) {
    headers.set("Authorization", `Bearer ${access}`);
  }
  if (!headers.has("Content-Type") && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Wrapper de fetch con:
 * - Authorization header automático desde sessionStorage
 * - Refresh de token si recibe 401
 * - Redirección a /login si el refresh también falla
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = buildHeaders(getAccessToken(), options.headers, options.body as BodyInit | null);
  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status !== 401) return res;

  // Token expirado → intentar renovar una vez
  const newToken = await refreshAccessToken();
  if (!newToken) {
    redirectToLogin();
    return res;
  }

  headers.set("Authorization", `Bearer ${newToken}`);
  res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    redirectToLogin();
  }

  return res;
}
