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

/**
 * Formatea la edad del paciente mostrando años y meses
 * @param edad - Edad en años (puede ser decimal)
 * @returns String formateado con años y meses, ej: "2 años - 3 meses"
 */
export function formatEdad(edad: number | null | undefined): string {
  if (edad == null) return "-";
  
  const años = Math.floor(edad);
  const meses = Math.round((edad - años) * 12);
  
  if (años === 0) {
    return meses === 1 ? "1 mes" : `${meses} meses`;
  }
  
  if (meses === 0) {
    return años === 1 ? "1 año" : `${años} años`;
  }
  
  const textoAños = años === 1 ? "1 año" : `${años} años`;
  const textoMeses = meses === 1 ? "1 mes" : `${meses} meses`;
  
  return `${textoAños} - ${textoMeses}`;
}
