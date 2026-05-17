import { clearSession } from "@/lib/session";

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    if (pathname !== "/login" && pathname !== "/registro") {
      window.location.replace("/login?clear_session=1");
    }
  }
}

/**
 * Flag para evitar race conditions en refresh de token.
 * Solo permite un refresh a la vez.
 */
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Intenta renovar el access token usando el refresh token
 * Solo permite un refresh a la vez para evitar race conditions
 */
async function refreshAccessToken(): Promise<boolean> {
  // Si ya hay un refresh en progreso, esperar su resultado
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        console.warn("Token refresh failed:", res.status);
        return false;
      }

      console.debug("Token refreshed successfully");
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Wrapper de fetch para interactuar con la API.
 * Si se ejecuta en el navegador, usa el BFF (/api/proxy).
 * Si se ejecuta en SSR, va directo a Django usando las cookies HttpOnly.
 *
 * En cliente, implementa auto-refresh en 401:
 * 1. Detecta 401
 * 2. Intenta refresh del token
 * 3. Si ok, reintentar request original
 * 4. Si falla, limpiar sesión y redirigir a login
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const isServer = typeof window === "undefined";

  let baseUrl = "/api/proxy";
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (isServer) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    baseUrl = API_URL as string;

    // Importación dinámica de next/headers para evitar errores en cliente
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Asegurar que path comienza con "/" o quitar doble slash
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  let res = await fetch(url, { ...options, headers });

  // En cliente, implementar retry automático en 401
  if (res.status === 401 && !isServer) {
    // Evitar retry en endpoints de auth
    if (!cleanPath.includes("/auth/")) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        // Reintentar la request original
        res = await fetch(url, { ...options, headers });
      }
    }

    // Si sigue siendo 401 (refresh falló o no se intentó), limpiar sesión
    if (res.status === 401) {
      clearSession();
      redirectToLogin();
    }
  }

  return res;
}

export async function swrFetcher<T = any>(url: string): Promise<T> {
  const res = await apiFetch(url);
  if (!res.ok) {
    const error: any = new Error("Error fetching data");
    error.status = res.status;
    try {
      error.info = await res.json();
    } catch {
      error.info = await res.text();
    }
    throw error;
  }
  return res.json();
}
