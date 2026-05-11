/**
 * Manejo centralizado de errores de la API.
 *
 * En lugar de `toast.error("mensaje genérico")` en cada página,
 * esta función distingue entre tipos de error y muestra mensajes
 * apropiados para cada situación.
 */

import { toast } from "sonner";

type ApiErrorMessages = {
  /** Mensaje para errores de validación (400). Por defecto: "Datos inválidos." */
  badRequest?: string;
  /** Mensaje para errores de permisos (403). Por defecto: "No tienes permiso para esta acción." */
  forbidden?: string;
  /** Mensaje para recurso no encontrado (404). Por defecto: "El recurso no fue encontrado." */
  notFound?: string;
  /** Mensaje para errores del servidor (5xx). Por defecto: "Error del servidor. Intenta nuevamente." */
  serverError?: string;
  /** Mensaje para errores de red (sin respuesta). Por defecto: "Error de conexión." */
  networkError?: string;
};

const DEFAULTS: Required<ApiErrorMessages> = {
  badRequest: "Datos inválidos.",
  forbidden: "No tienes permiso para esta acción.",
  notFound: "El recurso no fue encontrado.",
  serverError: "Error del servidor. Intenta nuevamente.",
  networkError: "Error de conexión.",
};

/**
 * Muestra un toast de error apropiado según el código HTTP de la respuesta.
 *
 * @param res     La respuesta de `apiFetch` (puede ser undefined si hubo error de red).
 * @param messages Mensajes personalizados opcionales por tipo de error.
 *
 * @example
 * const res = await apiFetch(`/pacientes/${id}/`, { method: "DELETE" });
 * if (!res.ok) {
 *   handleApiError(res, { notFound: "El paciente no existe." });
 *   return;
 * }
 */
export function handleApiError(
  res: Response | undefined,
  messages: ApiErrorMessages = {}
): void {
  const msg = { ...DEFAULTS, ...messages };

  if (!res) {
    toast.error(msg.networkError);
    return;
  }

  if (res.status === 400) {
    toast.error(msg.badRequest);
  } else if (res.status === 403) {
    toast.error(msg.forbidden);
  } else if (res.status === 404) {
    toast.error(msg.notFound);
  } else if (res.status >= 500) {
    toast.error(msg.serverError);
  } else {
    toast.error(msg.serverError);
  }
}

/**
 * Versión async que también captura errores de red (throw de fetch).
 * Útil para envolver bloques try/catch completos.
 *
 * @example
 * await withApiError(
 *   async () => {
 *     const res = await apiFetch("/pacientes/", { method: "POST", body: ... });
 *     if (!res.ok) return;
 *     toast.success("Paciente creado");
 *     reload();
 *   },
 *   { badRequest: "No se pudo crear el paciente." }
 * );
 */
export async function withApiError(
  fn: () => Promise<void>,
  messages: ApiErrorMessages = {}
): Promise<void> {
  try {
    await fn();
  } catch {
    handleApiError(undefined, messages);
  }
}
