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
  
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return null;
  
  const hoy = new Date();
  
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  
  // Ajustar si aún no ha cumplido años este año
  if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
    años--;
    meses += 12;
  }
  
  // Ajustar meses si el día actual es menor que el día de nacimiento
  if (hoy.getDate() < nacimiento.getDate()) {
    meses--;
    if (meses < 0) {
      meses = 11;
      años--;
    }
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
