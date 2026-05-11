/**
 * Pads a number to the given minimum number of digits with leading zeros.
 */
function pad(n: number, size: number): string {
  return String(n).padStart(size, "0");
}

/**
 * Formatea una fecha con hora en locale es-CL: dd/MM/yyyy HH:mm
 */
export function formatFechaHora(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  const day = pad(d.getDate(), 2);
  const month = pad(d.getMonth() + 1, 2);
  const year = pad(d.getFullYear(), 4);
  const hours = pad(d.getHours(), 2);
  const minutes = pad(d.getMinutes(), 2);
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formatea una fecha sin hora en locale es-CL: dd/MM/yyyy
 */
export function formatFecha(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  const day = pad(d.getDate(), 2);
  const month = pad(d.getMonth() + 1, 2);
  const year = pad(d.getFullYear(), 4);
  return `${day}/${month}/${year}`;
}
