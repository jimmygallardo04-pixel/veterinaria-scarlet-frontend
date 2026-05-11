import jsPDF from "jspdf";

// ── Types ─────────────────────────────────────────────────────────────────────

type Paciente = {
  id: number;
  nombre: string;
  raza?: string | null;
  edad?: number | null;
  color?: string | null;
  esterilizado?: boolean;
};

type Vacuna = {
  id: number;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis?: string | null;
  observaciones?: string | null;
};

type Tratamiento = {
  id: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  indicaciones?: string | null;
};

type Archivo = {
  id: number;
  archivo_url: string;
  storage_path?: string | null;
  tipo?: number | string;
  tipo_nombre?: string;
  fecha: string;
  observaciones?: string | null;
};

type FichaHistorial = {
  id: number;
  fecha: string;
  motivo_consulta: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
};

export type FichaDetalle = {
  id: number;
  paciente: Paciente;
  paciente_nombre: string;
  tutor_nombre: string;
  especie_nombre: string;
  sexo_nombre: string;
  edad?: number | null;
  fecha: string;
  motivo_consulta: string;
  anamnesis?: string | null;
  peso_kg?: string | null;
  temperatura?: string | null;
  frecuencia_cardiaca?: number | null;
  frecuencia_respiratoria?: number | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
  indicaciones?: string | null;
  observaciones?: string | null;
  vacunas: Vacuna[];
  tratamientos: Tratamiento[];
  archivos: Archivo[];
  historial_fichas: FichaHistorial[];
};

// ── Pure helper functions (testable without jsPDF) ────────────────────────────

/**
 * Returns an array of text lines that will be included in the PDF.
 * This pure function is easily testable with fast-check.
 */
export function buildPdfContent(ficha: FichaDetalle): string[] {
  const lines: string[] = [];

  // Header
  lines.push("Veterinaria Scarlet");
  lines.push("Ficha Clínica");

  // Patient info
  lines.push(`Paciente: ${ficha.paciente_nombre}`);
  lines.push(`Especie: ${ficha.especie_nombre}`);
  lines.push(`Tutor: ${ficha.tutor_nombre}`);
  lines.push(`Fecha de consulta: ${ficha.fecha}`);

  // Consultation
  lines.push(`Motivo de consulta: ${ficha.motivo_consulta}`);

  if (ficha.anamnesis) {
    lines.push(`Anamnesis: ${ficha.anamnesis}`);
  }

  // Vital signs
  const vitales: string[] = [];
  if (ficha.peso_kg) vitales.push(`Peso: ${ficha.peso_kg} kg`);
  if (ficha.temperatura) vitales.push(`Temperatura: ${ficha.temperatura} °C`);
  if (ficha.frecuencia_cardiaca) vitales.push(`F. cardíaca: ${ficha.frecuencia_cardiaca} lpm`);
  if (ficha.frecuencia_respiratoria) vitales.push(`F. respiratoria: ${ficha.frecuencia_respiratoria} rpm`);
  if (vitales.length > 0) {
    lines.push("Signos vitales:");
    lines.push(...vitales);
  }

  // Clinical findings
  if (ficha.diagnostico) {
    lines.push(`Diagnóstico: ${ficha.diagnostico}`);
  }
  if (ficha.tratamiento) {
    lines.push(`Tratamiento: ${ficha.tratamiento}`);
  }
  if (ficha.indicaciones) {
    lines.push(`Indicaciones: ${ficha.indicaciones}`);
  }
  if (ficha.observaciones) {
    lines.push(`Observaciones: ${ficha.observaciones}`);
  }

  return lines;
}

/**
 * Returns the filename for the PDF download.
 * Pattern: ficha_{pacienteId}_{fecha}.pdf
 */
export function buildPdfFilename(pacienteId: number, fecha: string): string {
  // Sanitize fecha: replace characters that are invalid in filenames
  const fechaSanitized = fecha.replace(/[/:]/g, "-").replace(/\s+/g, "_");
  return `ficha_${pacienteId}_${fechaSanitized}.pdf`;
}

// ── Main export function ──────────────────────────────────────────────────────

/**
 * Generates and downloads a PDF for the given clinical record.
 * Throws on error so the caller can show a toast.
 */
export function exportarFichaPDF(ficha: FichaDetalle): void {
  const doc = new jsPDF();
  const lines = buildPdfContent(ficha);
  const filename = buildPdfFilename(ficha.paciente.id, ficha.fecha);

  let y = 20;
  const lineHeight = 8;
  const margin = 14;
  const pageHeight = doc.internal.pageSize.getHeight();

  lines.forEach((line, index) => {
    // Header styling
    if (index === 0) {
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
    } else if (index === 1) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
    }

    // Add new page if needed
    if (y + lineHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    doc.text(line, margin, y);
    y += lineHeight;
  });

  doc.save(filename);
}
