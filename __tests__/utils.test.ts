import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatFechaHora, formatFecha } from "../lib/utils";

// Feature: veterinaria-scarlet-backlog, Propiedad 18: formatFechaHora produce formato correcto para cualquier datetime válido

// Dates are constrained to years 1000–9999 to ensure a 4-digit year in dd/MM/yyyy HH:mm format.
// noInvalidDate: true ensures fc.date() never generates new Date(NaN).
const validDateArb = fc.date({
  min: new Date("1000-01-01T00:00:00.000Z"),
  max: new Date("9999-12-31T23:59:59.999Z"),
  noInvalidDate: true,
});

describe("formatFechaHora — Propiedad 18: produce formato correcto para cualquier datetime válido", () => {
  // Validates: Requirements 9.1
  it("siempre devuelve un string con formato dd/MM/yyyy HH:mm para cualquier Date válido", () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const result = formatFechaHora(date);
        // Pattern: dd/MM/yyyy HH:mm  (e.g. "01/06/2024 14:30")
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
      }),
      { numRuns: 100 }
    );
  });

  it("devuelve un string no vacío y distinto de '-' para cualquier Date válido", () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const result = formatFechaHora(date);
        expect(result).not.toBe("-");
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: veterinaria-scarlet-backlog, Propiedad 19: formatFecha produce formato correcto para cualquier fecha válida

describe("formatFecha — Propiedad 19: produce formato correcto para cualquier fecha válida", () => {
  // Validates: Requirements 9.2
  it("siempre devuelve un string con formato dd/MM/yyyy para cualquier Date válido", () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const result = formatFecha(date);
        // Pattern: dd/MM/yyyy  (e.g. "01/06/2024")
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      }),
      { numRuns: 100 }
    );
  });

  it("devuelve un string no vacío y distinto de '-' para cualquier Date válido", () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const result = formatFecha(date);
        expect(result).not.toBe("-");
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: veterinaria-scarlet-backlog, Propiedad 20: Funciones de formato devuelven "-" para entradas inválidas

describe("Funciones de formato — Propiedad 20: devuelven '-' para entradas inválidas", () => {
  // Validates: Requirements 9.4
  it("formatFechaHora devuelve '-' para null, undefined y strings no-fecha sin lanzar excepciones", () => {
    // null
    fc.assert(
      fc.property(fc.constant(null), (value) => {
        expect(formatFechaHora(value)).toBe("-");
      }),
      { numRuns: 10 }
    );

    // undefined
    fc.assert(
      fc.property(fc.constant(undefined), (value) => {
        expect(formatFechaHora(value)).toBe("-");
      }),
      { numRuns: 10 }
    );

    // Non-date strings (filter out strings that happen to be valid dates)
    fc.assert(
      fc.property(
        fc.string().filter((s) => isNaN(new Date(s).getTime()) || s.trim() === ""),
        (value) => {
          expect(formatFechaHora(value)).toBe("-");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("formatFecha devuelve '-' para null, undefined y strings no-fecha sin lanzar excepciones", () => {
    // null
    fc.assert(
      fc.property(fc.constant(null), (value) => {
        expect(formatFecha(value)).toBe("-");
      }),
      { numRuns: 10 }
    );

    // undefined
    fc.assert(
      fc.property(fc.constant(undefined), (value) => {
        expect(formatFecha(value)).toBe("-");
      }),
      { numRuns: 10 }
    );

    // Non-date strings (filter out strings that happen to be valid dates)
    fc.assert(
      fc.property(
        fc.string().filter((s) => isNaN(new Date(s).getTime()) || s.trim() === ""),
        (value) => {
          expect(formatFecha(value)).toBe("-");
        }
      ),
      { numRuns: 100 }
    );
  });
});
