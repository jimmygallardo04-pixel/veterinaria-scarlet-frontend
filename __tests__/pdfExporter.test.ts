// Feature: veterinaria-scarlet-backlog, Propiedad 14: PDF generado contiene todos los campos requeridos y nombre de clínica

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildPdfContent, buildPdfFilename, type FichaDetalle } from "../lib/pdfExporter";

// ── Arbitraries ───────────────────────────────────────────────────────────────

const nonEmptyString = fc.string({ minLength: 1, maxLength: 80 });

const pacienteArb = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  nombre: nonEmptyString,
  raza: fc.option(nonEmptyString, { nil: null }),
  edad: fc.option(fc.integer({ min: 0, max: 30 }), { nil: null }),
  color: fc.option(nonEmptyString, { nil: null }),
  esterilizado: fc.boolean(),
});

const vacunaArb = fc.record({
  id: fc.integer({ min: 1 }),
  nombre_vacuna: nonEmptyString,
  fecha_aplicacion: fc.constant("2024-01-01"),
  proxima_dosis: fc.option(fc.constant("2025-01-01"), { nil: null }),
  observaciones: fc.option(nonEmptyString, { nil: null }),
});

const tratamientoArb = fc.record({
  id: fc.integer({ min: 1 }),
  medicamento: nonEmptyString,
  dosis: nonEmptyString,
  frecuencia: nonEmptyString,
  fecha_inicio: fc.constant("2024-01-01"),
  fecha_fin: fc.option(fc.constant("2024-02-01"), { nil: null }),
  indicaciones: fc.option(nonEmptyString, { nil: null }),
});

const fichaDetalleArb = fc.record<FichaDetalle>({
  id: fc.integer({ min: 1 }),
  paciente: pacienteArb,
  paciente_nombre: nonEmptyString,
  tutor_nombre: nonEmptyString,
  especie_nombre: nonEmptyString,
  sexo_nombre: nonEmptyString,
  edad: fc.option(fc.integer({ min: 0, max: 30 }), { nil: null }),
  fecha: fc.constant("2024-06-15T10:30:00Z"),
  motivo_consulta: nonEmptyString,
  anamnesis: fc.option(nonEmptyString, { nil: null }),
  peso_kg: fc.option(fc.constant("5.2"), { nil: null }),
  temperatura: fc.option(fc.constant("38.5"), { nil: null }),
  frecuencia_cardiaca: fc.option(fc.integer({ min: 40, max: 200 }), { nil: null }),
  frecuencia_respiratoria: fc.option(fc.integer({ min: 10, max: 60 }), { nil: null }),
  diagnostico: fc.option(nonEmptyString, { nil: null }),
  tratamiento: fc.option(nonEmptyString, { nil: null }),
  indicaciones: fc.option(nonEmptyString, { nil: null }),
  observaciones: fc.option(nonEmptyString, { nil: null }),
  vacunas: fc.array(vacunaArb, { maxLength: 3 }),
  tratamientos: fc.array(tratamientoArb, { maxLength: 3 }),
  archivos: fc.constant([]),
  historial_fichas: fc.constant([]),
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("buildPdfContent — Propiedad 14: PDF contiene todos los campos requeridos y nombre de clínica", () => {
  // Validates: Requirements 6.2, 6.3, 6.4

  it("siempre incluye 'Veterinaria Scarlet' en el contenido", () => {
    fc.assert(
      fc.property(fichaDetalleArb, (ficha) => {
        const lines = buildPdfContent(ficha);
        const content = lines.join("\n");
        expect(content).toContain("Veterinaria Scarlet");
      }),
      { numRuns: 100 }
    );
  });

  it("siempre incluye el nombre del paciente en el contenido", () => {
    fc.assert(
      fc.property(fichaDetalleArb, (ficha) => {
        const lines = buildPdfContent(ficha);
        const content = lines.join("\n");
        expect(content).toContain(ficha.paciente_nombre);
      }),
      { numRuns: 100 }
    );
  });

  it("siempre incluye la especie en el contenido", () => {
    fc.assert(
      fc.property(fichaDetalleArb, (ficha) => {
        const lines = buildPdfContent(ficha);
        const content = lines.join("\n");
        expect(content).toContain(ficha.especie_nombre);
      }),
      { numRuns: 100 }
    );
  });

  it("siempre incluye el tutor en el contenido", () => {
    fc.assert(
      fc.property(fichaDetalleArb, (ficha) => {
        const lines = buildPdfContent(ficha);
        const content = lines.join("\n");
        expect(content).toContain(ficha.tutor_nombre);
      }),
      { numRuns: 100 }
    );
  });

  it("siempre incluye la fecha de consulta en el contenido", () => {
    fc.assert(
      fc.property(fichaDetalleArb, (ficha) => {
        const lines = buildPdfContent(ficha);
        const content = lines.join("\n");
        expect(content).toContain(ficha.fecha);
      }),
      { numRuns: 100 }
    );
  });

  it("siempre incluye el motivo de consulta en el contenido", () => {
    fc.assert(
      fc.property(fichaDetalleArb, (ficha) => {
        const lines = buildPdfContent(ficha);
        const content = lines.join("\n");
        expect(content).toContain(ficha.motivo_consulta);
      }),
      { numRuns: 100 }
    );
  });

  it("incluye el diagnóstico cuando está presente", () => {
    fc.assert(
      fc.property(
        fichaDetalleArb.filter((f) => f.diagnostico != null && f.diagnostico !== ""),
        (ficha) => {
          const lines = buildPdfContent(ficha);
          const content = lines.join("\n");
          expect(content).toContain(ficha.diagnostico!);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("incluye el tratamiento cuando está presente", () => {
    fc.assert(
      fc.property(
        fichaDetalleArb.filter((f) => f.tratamiento != null && f.tratamiento !== ""),
        (ficha) => {
          const lines = buildPdfContent(ficha);
          const content = lines.join("\n");
          expect(content).toContain(ficha.tratamiento!);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("incluye las indicaciones cuando están presentes", () => {
    fc.assert(
      fc.property(
        fichaDetalleArb.filter((f) => f.indicaciones != null && f.indicaciones !== ""),
        (ficha) => {
          const lines = buildPdfContent(ficha);
          const content = lines.join("\n");
          expect(content).toContain(ficha.indicaciones!);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("devuelve un array no vacío de líneas para cualquier ficha", () => {
    fc.assert(
      fc.property(fichaDetalleArb, (ficha) => {
        const lines = buildPdfContent(ficha);
        expect(lines.length).toBeGreaterThan(0);
        lines.forEach((line) => expect(typeof line).toBe("string"));
      }),
      { numRuns: 100 }
    );
  });
});

describe("buildPdfFilename — Propiedad 14: nombre del archivo sigue el patrón ficha_{pacienteId}_{fecha}.pdf", () => {
  // Validates: Requirements 6.3, 6.4

  it("siempre produce un nombre que empieza con 'ficha_' y termina con '.pdf'", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999999 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (pacienteId, fecha) => {
          const filename = buildPdfFilename(pacienteId, fecha);
          expect(filename).toMatch(/^ficha_\d+_.+\.pdf$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("siempre incluye el id del paciente en el nombre del archivo", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999999 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (pacienteId, fecha) => {
          const filename = buildPdfFilename(pacienteId, fecha);
          expect(filename).toContain(`ficha_${pacienteId}_`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("el nombre del archivo tiene extensión .pdf", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999999 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (pacienteId, fecha) => {
          const filename = buildPdfFilename(pacienteId, fecha);
          expect(filename.endsWith(".pdf")).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
