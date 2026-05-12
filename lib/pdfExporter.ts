import jsPDF from "jspdf";

// ── Types ─────────────────────────────────────────────────────────────────────

type Paciente = {
  id: number;
  nombre: string;
  raza?: string | null;
  fecha_nacimiento?: string | null;
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

// ── Date helpers ──────────────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Formats an ISO date/datetime string as dd/MM/yyyy */
export function formatFecha(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Formats an ISO datetime string as dd/MM/yyyy HH:mm */
export function formatFechaHora(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Calculates age string from birth date */
export function formatEdad(fechaNacimiento: string | null | undefined): string {
  if (!fechaNacimiento) return "-";
  const parts = fechaNacimiento.split("T")[0].split("-").map(Number);
  const nacimiento = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(nacimiento.getTime())) return "-";
  const hoy = new Date();
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  if (hoy.getDate() < nacimiento.getDate()) meses--;
  if (meses < 0) { años--; meses += 12; }
  años = Math.max(0, años);
  meses = Math.max(0, meses);
  if (años === 0) return meses === 1 ? "1 mes" : `${meses} meses`;
  if (meses === 0) return años === 1 ? "1 año" : `${años} años`;
  return `${años === 1 ? "1 año" : `${años} años`} y ${meses === 1 ? "1 mes" : `${meses} meses`}`;
}

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
  const fechaSanitized = fecha.replace(/[/:]/g, "-").replace(/\s+/g, "_");
  return `ficha_${pacienteId}_${fechaSanitized}.pdf`;
}

// ── PDF layout constants ──────────────────────────────────────────────────────

const MARGIN = 14;
const PAGE_WIDTH = 210; // A4 mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAGE_HEIGHT = 297; // A4 mm
const FOOTER_HEIGHT = 14;
const COLORS = {
  primary: [30, 90, 160] as [number, number, number],    // deep blue
  accent: [220, 38, 38] as [number, number, number],     // scarlet red
  sectionBg: [241, 245, 249] as [number, number, number], // slate-100
  border: [203, 213, 225] as [number, number, number],   // slate-300
  text: [30, 41, 59] as [number, number, number],        // slate-800
  muted: [100, 116, 139] as [number, number, number],    // slate-500
  white: [255, 255, 255] as [number, number, number],
  rowAlt: [248, 250, 252] as [number, number, number],   // slate-50
};

// ── PDF builder class ─────────────────────────────────────────────────────────

class PdfBuilder {
  private doc: jsPDF;
  private y: number;
  private pageNum: number;
  private totalPages: number;
  private ficha: FichaDetalle;

  constructor(ficha: FichaDetalle) {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
    this.y = 0;
    this.pageNum = 1;
    this.totalPages = 1; // updated after build
    this.ficha = ficha;
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private get pageContentBottom(): number {
    return PAGE_HEIGHT - FOOTER_HEIGHT - 6;
  }

  private ensureSpace(needed: number): void {
    if (this.y + needed > this.pageContentBottom) {
      this.addFooter();
      this.doc.addPage();
      this.pageNum++;
      this.y = 20;
    }
  }

  private setColor(color: [number, number, number]): void {
    this.doc.setTextColor(color[0], color[1], color[2]);
  }

  private setFill(color: [number, number, number]): void {
    this.doc.setFillColor(color[0], color[1], color[2]);
  }

  private setDraw(color: [number, number, number]): void {
    this.doc.setDrawColor(color[0], color[1], color[2]);
  }

  /** Wraps text and returns the number of lines printed */
  private printWrapped(
    text: string,
    x: number,
    maxWidth: number,
    lineHeight: number,
    bold = false
  ): number {
    this.doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = this.doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.doc.text(line, x, this.y);
      this.y += lineHeight;
    }
    return lines.length;
  }

  /** Prints a label + value pair on the same line */
  private printField(label: string, value: string | null | undefined, lineHeight = 6): void {
    if (!value) return;
    this.ensureSpace(lineHeight + 2);
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.setColor(COLORS.text);
    this.doc.text(`${label}:`, MARGIN, this.y);
    const labelWidth = this.doc.getTextWidth(`${label}: `);
    this.doc.setFont("helvetica", "normal");
    const valueLines = this.doc.splitTextToSize(value, CONTENT_WIDTH - labelWidth);
    this.doc.text(valueLines[0], MARGIN + labelWidth, this.y);
    this.y += lineHeight;
    // overflow lines
    for (let i = 1; i < valueLines.length; i++) {
      this.ensureSpace(lineHeight);
      this.doc.text(valueLines[i], MARGIN + labelWidth, this.y);
      this.y += lineHeight;
    }
  }

  /** Prints a multiline text block with a bold label on its own line */
  private printBlock(label: string, value: string | null | undefined): void {
    if (!value) return;
    this.ensureSpace(14);
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.setColor(COLORS.muted);
    this.doc.text(label.toUpperCase(), MARGIN, this.y);
    this.y += 5;
    this.doc.setFont("helvetica", "normal");
    this.setColor(COLORS.text);
    this.printWrapped(value, MARGIN, CONTENT_WIDTH, 5.5);
    this.y += 2;
  }

  // ── Section header ──────────────────────────────────────────────────────────

  private sectionHeader(title: string): void {
    this.ensureSpace(12);
    this.setFill(COLORS.sectionBg);
    this.setDraw(COLORS.border);
    this.doc.setLineWidth(0.1);
    this.doc.roundedRect(MARGIN, this.y - 4, CONTENT_WIDTH, 9, 1.5, 1.5, "FD");
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.setColor(COLORS.primary);
    this.doc.text(title, MARGIN + 3, this.y + 2);
    this.y += 10;
  }

  // ── Divider ─────────────────────────────────────────────────────────────────

  private divider(): void {
    this.ensureSpace(4);
    this.setDraw(COLORS.border);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN, this.y, MARGIN + CONTENT_WIDTH, this.y);
    this.y += 4;
  }

  // ── Header page ─────────────────────────────────────────────────────────────

  private addHeader(): void {
    // Top accent bar
    this.setFill(COLORS.accent);
    this.doc.rect(0, 0, PAGE_WIDTH, 3, "F");

    // Clinic name
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.setColor(COLORS.primary);
    this.doc.text("Veterinaria Scarlet", MARGIN, 16);

    // Subtitle
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.setColor(COLORS.muted);
    this.doc.text("Ficha Clínica", MARGIN, 23);

    // Ficha ID + date on the right
    this.doc.setFontSize(8);
    this.setColor(COLORS.muted);
    const fichaInfo = `Ficha #${this.ficha.id}`;
    const fechaInfo = `Fecha: ${formatFechaHora(this.ficha.fecha)}`;
    const generadoInfo = `Generado: ${formatFechaHora(new Date().toISOString())}`;
    this.doc.text(fichaInfo, PAGE_WIDTH - MARGIN, 12, { align: "right" });
    this.doc.text(fechaInfo, PAGE_WIDTH - MARGIN, 17, { align: "right" });
    this.doc.text(generadoInfo, PAGE_WIDTH - MARGIN, 22, { align: "right" });

    // Separator line
    this.setDraw(COLORS.accent);
    this.doc.setLineWidth(0.5);
    this.doc.line(MARGIN, 27, MARGIN + CONTENT_WIDTH, 27);

    this.y = 34;
  }

  // ── Footer ──────────────────────────────────────────────────────────────────

  private addFooter(): void {
    const footerY = PAGE_HEIGHT - FOOTER_HEIGHT;
    this.setDraw(COLORS.border);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN, footerY, MARGIN + CONTENT_WIDTH, footerY);
    this.doc.setFontSize(7.5);
    this.doc.setFont("helvetica", "normal");
    this.setColor(COLORS.muted);
    this.doc.text("Veterinaria Scarlet — Documento generado automáticamente", MARGIN, footerY + 5);
    this.doc.text(
      `Página ${this.pageNum}`,
      PAGE_WIDTH - MARGIN,
      footerY + 5,
      { align: "right" }
    );
  }

  // ── Sections ─────────────────────────────────────────────────────────────────

  private addPaciente(): void {
    this.sectionHeader("Paciente");

    const p = this.ficha.paciente;
    const col1X = MARGIN;
    const col2X = MARGIN + CONTENT_WIDTH / 2 + 2;
    const colW = CONTENT_WIDTH / 2 - 4;
    const lh = 6;

    const printCol = (label: string, value: string | null | undefined, x: number) => {
      if (!value) return;
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "bold");
      this.setColor(COLORS.text);
      this.doc.text(`${label}:`, x, this.y);
      const lw = this.doc.getTextWidth(`${label}: `);
      this.doc.setFont("helvetica", "normal");
      const lines = this.doc.splitTextToSize(value, colW - lw);
      this.doc.text(lines[0], x + lw, this.y);
    };

    // Row 1
    this.ensureSpace(lh);
    printCol("Nombre", this.ficha.paciente_nombre, col1X);
    printCol("Tutor", this.ficha.tutor_nombre || "-", col2X);
    this.y += lh;

    // Row 2
    this.ensureSpace(lh);
    printCol("Especie", this.ficha.especie_nombre, col1X);
    printCol("Raza", p.raza || "-", col2X);
    this.y += lh;

    // Row 3
    this.ensureSpace(lh);
    printCol("Sexo", this.ficha.sexo_nombre, col1X);
    printCol("Color", p.color || "-", col2X);
    this.y += lh;

    // Row 4
    this.ensureSpace(lh);
    printCol("Edad", formatEdad(p.fecha_nacimiento), col1X);
    printCol("Esterilizado", p.esterilizado ? "Sí" : "No", col2X);
    this.y += lh + 2;
  }

  private addConsulta(): void {
    this.sectionHeader("Consulta");
    this.printBlock("Motivo de consulta", this.ficha.motivo_consulta);
    this.printBlock("Anamnesis", this.ficha.anamnesis);
    this.printBlock("Diagnóstico", this.ficha.diagnostico);
    this.printBlock("Tratamiento", this.ficha.tratamiento);
    this.printBlock("Indicaciones", this.ficha.indicaciones);
    this.printBlock("Observaciones", this.ficha.observaciones);
    this.y += 2;
  }

  private addSignosVitales(): void {
    const { peso_kg, temperatura, frecuencia_cardiaca, frecuencia_respiratoria } = this.ficha;
    if (!peso_kg && !temperatura && !frecuencia_cardiaca && !frecuencia_respiratoria) return;

    this.sectionHeader("Signos Vitales");

    const items: Array<{ label: string; value: string; unit: string }> = [];
    if (peso_kg) items.push({ label: "Peso", value: peso_kg, unit: "kg" });
    if (temperatura) items.push({ label: "Temperatura", value: temperatura, unit: "°C" });
    if (frecuencia_cardiaca) items.push({ label: "Frec. cardíaca", value: String(frecuencia_cardiaca), unit: "lpm" });
    if (frecuencia_respiratoria) items.push({ label: "Frec. respiratoria", value: String(frecuencia_respiratoria), unit: "rpm" });

    const cellW = CONTENT_WIDTH / items.length;
    const boxH = 14;

    this.ensureSpace(boxH + 4);

    items.forEach((item, i) => {
      const x = MARGIN + i * cellW;
      this.setFill(COLORS.sectionBg);
      this.setDraw(COLORS.border);
      this.doc.setLineWidth(0.1);
      this.doc.roundedRect(x, this.y, cellW - 2, boxH, 1.5, 1.5, "FD");

      // Label
      this.doc.setFontSize(7.5);
      this.doc.setFont("helvetica", "normal");
      this.setColor(COLORS.muted);
      this.doc.text(item.label, x + (cellW - 2) / 2, this.y + 4.5, { align: "center" });

      // Value
      this.doc.setFontSize(13);
      this.doc.setFont("helvetica", "bold");
      this.setColor(COLORS.primary);
      this.doc.text(item.value, x + (cellW - 2) / 2, this.y + 10, { align: "center" });

      // Unit
      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", "normal");
      this.setColor(COLORS.muted);
      this.doc.text(item.unit, x + (cellW - 2) / 2, this.y + 13.5, { align: "center" });
    });

    this.y += boxH + 6;
  }

  private addVacunas(): void {
    if (!this.ficha.vacunas || this.ficha.vacunas.length === 0) return;

    this.sectionHeader("Vacunas");

    const cols = [
      { label: "Vacuna", width: 60 },
      { label: "Fecha aplicación", width: 38 },
      { label: "Próxima dosis", width: 38 },
      { label: "Observaciones", width: CONTENT_WIDTH - 60 - 38 - 38 },
    ];

    this.renderTable(
      cols,
      this.ficha.vacunas.map((v) => [
        v.nombre_vacuna,
        formatFecha(v.fecha_aplicacion),
        formatFecha(v.proxima_dosis) || "-",
        v.observaciones || "-",
      ])
    );
  }

  private addTratamientos(): void {
    if (!this.ficha.tratamientos || this.ficha.tratamientos.length === 0) return;

    this.sectionHeader("Tratamientos");

    const cols = [
      { label: "Medicamento", width: 45 },
      { label: "Dosis", width: 28 },
      { label: "Frecuencia", width: 30 },
      { label: "Inicio", width: 28 },
      { label: "Fin", width: 28 },
      { label: "Indicaciones", width: CONTENT_WIDTH - 45 - 28 - 30 - 28 - 28 },
    ];

    this.renderTable(
      cols,
      this.ficha.tratamientos.map((t) => [
        t.medicamento,
        t.dosis,
        t.frecuencia,
        formatFecha(t.fecha_inicio),
        formatFecha(t.fecha_fin) || "-",
        t.indicaciones || "-",
      ])
    );
  }

  private addHistorial(): void {
    if (!this.ficha.historial_fichas || this.ficha.historial_fichas.length === 0) return;

    this.sectionHeader("Historial de Fichas Anteriores");

    const cols = [
      { label: "Fecha", width: 36 },
      { label: "Motivo", width: 60 },
      { label: "Diagnóstico", width: CONTENT_WIDTH - 36 - 60 },
    ];

    this.renderTable(
      cols,
      this.ficha.historial_fichas.map((h) => [
        formatFechaHora(h.fecha),
        h.motivo_consulta,
        h.diagnostico || "-",
      ])
    );
  }

  // ── Generic table renderer ──────────────────────────────────────────────────

  private renderTable(
    cols: Array<{ label: string; width: number }>,
    rows: string[][]
  ): void {
    const rowH = 7;
    const headerH = 7;
    const cellPad = 2.5;

    // Header row
    this.ensureSpace(headerH + rowH);
    this.setFill(COLORS.primary);
    this.doc.rect(MARGIN, this.y, CONTENT_WIDTH, headerH, "F");

    let xCursor = MARGIN;
    cols.forEach((col) => {
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "bold");
      this.setColor(COLORS.white);
      this.doc.text(col.label, xCursor + cellPad, this.y + 4.8);
      xCursor += col.width;
    });
    this.y += headerH;

    // Data rows
    rows.forEach((row, rowIdx) => {
      // Estimate height needed for this row (check for wrapped text)
      let maxLines = 1;
      row.forEach((cell, colIdx) => {
        const lines = this.doc.splitTextToSize(cell, cols[colIdx].width - cellPad * 2);
        if (lines.length > maxLines) maxLines = lines.length;
      });
      const thisRowH = Math.max(rowH, maxLines * 5 + 3);

      this.ensureSpace(thisRowH);

      // Alternating row background
      if (rowIdx % 2 === 0) {
        this.setFill(COLORS.rowAlt);
        this.doc.rect(MARGIN, this.y, CONTENT_WIDTH, thisRowH, "F");
      }

      // Row border
      this.setDraw(COLORS.border);
      this.doc.setLineWidth(0.1);
      this.doc.rect(MARGIN, this.y, CONTENT_WIDTH, thisRowH, "S");

      // Cell content
      xCursor = MARGIN;
      row.forEach((cell, colIdx) => {
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.setColor(COLORS.text);
        const lines = this.doc.splitTextToSize(cell, cols[colIdx].width - cellPad * 2);
        lines.forEach((line: string, lineIdx: number) => {
          this.doc.text(line, xCursor + cellPad, this.y + 4.5 + lineIdx * 5);
        });
        xCursor += cols[colIdx].width;
      });

      this.y += thisRowH;
    });

    this.y += 4;
  }

  // ── Main build ───────────────────────────────────────────────────────────────

  build(): jsPDF {
    this.addHeader();
    this.addPaciente();
    this.divider();
    this.addSignosVitales();
    this.addConsulta();
    this.addVacunas();
    this.addTratamientos();
    this.addHistorial();
    this.addFooter();
    return this.doc;
  }
}

// ── Main export function ──────────────────────────────────────────────────────

/**
 * Generates and downloads a PDF for the given clinical record.
 * Throws on error so the caller can show a toast.
 */
export function exportarFichaPDF(ficha: FichaDetalle): void {
  const builder = new PdfBuilder(ficha);
  const doc = builder.build();
  const filename = buildPdfFilename(ficha.paciente.id, ficha.fecha);
  doc.save(filename);
}
