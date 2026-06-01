/**
 * Devuelve cuántos días faltan (positivo) o han pasado (negativo) desde hoy
 * hasta una fecha dada. Útil para mostrar "en 5 días" o "hace 3 días".
 */
export function diasDesdeHoy(fecha: string | null | undefined): number | null {
  if (!fecha) return null;
  const [year, month, day] = fecha.split("T")[0].split("-").map(Number);
  const objetivo = new Date(year, month - 1, day);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = objetivo.getTime() - hoy.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Formatea la diferencia de días en texto legible.
 * Ej: "hoy", "mañana", "en 5 días", "hace 3 días"
 */
export function formatDiasRestantes(fecha: string | null | undefined): string {
  const dias = diasDesdeHoy(fecha);
  if (dias === null) return "-";
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias === -1) return "ayer";
  if (dias > 0) return `en ${dias} días`;
  return `hace ${Math.abs(dias)} días`;
}

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
 * Calcula la edad en años y meses desde una fecha de nacimiento
 * @param fechaNacimiento - Fecha de nacimiento en formato ISO (YYYY-MM-DD) o Date
 * @returns Objeto con años y meses
 */
export function calcularEdad(fechaNacimiento: string | Date | null | undefined): { años: number; meses: number } | null {
  if (!fechaNacimiento) return null;
  
  // Si es string en formato YYYY-MM-DD, parsearlo como fecha local
  let nacimiento: Date;
  if (typeof fechaNacimiento === 'string') {
    const [year, month, day] = fechaNacimiento.split('T')[0].split('-').map(Number);
    nacimiento = new Date(year, month - 1, day);
  } else {
    nacimiento = new Date(fechaNacimiento);
  }
  
  if (isNaN(nacimiento.getTime())) return null;
  
  const hoy = new Date();
  
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  
  // Ajustar meses si el día actual es menor que el día de nacimiento
  if (hoy.getDate() < nacimiento.getDate()) {
    meses--;
  }
  
  // Si los meses son negativos, restar un año y sumar 12 meses
  if (meses < 0) {
    años--;
    meses += 12;
  }
  
  return { años: Math.max(0, años), meses: Math.max(0, meses) };
}

/**
 * Formatea la edad del paciente mostrando años y meses desde la fecha de nacimiento
 * @param fechaNacimiento - Fecha de nacimiento en formato ISO (YYYY-MM-DD) o Date
 * @returns String formateado con años y meses, ej: "2 años y 3 meses"
 */
export function formatEdad(fechaNacimiento: string | Date | null | undefined): string {
  const edad = calcularEdad(fechaNacimiento);
  if (!edad) return "-";
  
  const { años, meses } = edad;
  
  // Solo meses (menos de 1 año)
  if (años === 0) {
    return meses === 1 ? "1 mes" : `${meses} meses`;
  }
  
  // Solo años (meses = 0)
  if (meses === 0) {
    return años === 1 ? "1 año" : `${años} años`;
  }
  
  // Años y meses
  const textoAños = años === 1 ? "1 año" : `${años} años`;
  const textoMeses = meses === 1 ? "1 mes" : `${meses} meses`;
  
  return `${textoAños} y ${textoMeses}`;
}
