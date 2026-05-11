/**
 * Utilidades centralizadas para manejo de sesión JWT.
 *
 * Todos los accesos a sessionStorage/localStorage relacionados con tokens
 * deben pasar por este módulo para mantener consistencia.
 */

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";
const USER_CACHE_KEY = "user_me";

export function saveTokens(access: string, refresh: string): void {
  sessionStorage.setItem(ACCESS_KEY, access);
  sessionStorage.setItem(REFRESH_KEY, refresh);
  // Limpiar tokens que pudieran haber quedado en localStorage
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  // Invalidar caché de usuario anterior
  sessionStorage.removeItem(USER_CACHE_KEY);
}

export function clearSession(): void {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_CACHE_KEY);
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}
