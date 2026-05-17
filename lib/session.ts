/**
 * Utilidades centralizadas para gestión y limpieza de sesión.
 * 
 * El sistema utiliza:
 * - HttpOnly cookies para tokens (access_token, refresh_token)
 * - sessionStorage para caché de usuario (user_me)
 * - localStorage para sincronización entre pestañas (session_inactivity)
 */

const USER_CACHE_KEY = "user_me";
const SESSION_INACTIVITY_KEY = "session_inactivity";

/**
 * Limpia toda la sesión del usuario:
 * - Elimina cookies de tokens (vía API)
 * - Limpia sessionStorage
 * - Limpia localStorage de sincronización
 */
export function clearSession(): void {
  // Limpiar caché de usuario en sessionStorage
  sessionStorage.removeItem(USER_CACHE_KEY);
  
  // Limpiar clave de sincronización de inactividad
  localStorage.removeItem(SESSION_INACTIVITY_KEY);
  
  // Llamar a la API para limpiar cookies HttpOnly
  if (typeof window !== "undefined") {
    // Usar sendBeacon para asegurar que la petición se envíe incluso si la página se cierra
    try {
      // sendBeacon funciona mejor con FormData o strings vacíos
      navigator.sendBeacon("/api/auth/logout");
    } catch (e) {
      console.warn("sendBeacon failed:", e);
    }
    
    // También intentar con fetch (más confiable en algunos casos)
    fetch("/api/auth/logout", { 
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }
}

/**
 * Guarda el usuario en caché (sessionStorage)
 */
export function cacheUser(user: unknown): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn("No se pudo cachear usuario:", e);
  }
}

/**
 * Obtiene el usuario desde caché (sessionStorage)
 */
export function getCachedUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const cached = sessionStorage.getItem(USER_CACHE_KEY);
  if (!cached) return null;
  try {
    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
}

/**
 * Verifica si hay tokens de sesión activos
 * Nota: No podemos leer cookies HttpOnly desde JavaScript,
 * pero podemos verificar si existen haciendo una petición.
 */
export async function hasActiveSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Marca la sesión como inactiva en localStorage para notificar otras pestañas
 */
export function broadcastSessionEnd(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SESSION_INACTIVITY_KEY,
      JSON.stringify({
        type: "logout",
        timestamp: Date.now(),
        reason: "inactivity",
      })
    );
  } catch (e) {
    console.warn("No se pudo broadcastear fin de sesión:", e);
  }
}