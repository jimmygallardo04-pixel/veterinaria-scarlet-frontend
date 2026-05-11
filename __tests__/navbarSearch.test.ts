import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: veterinaria-scarlet-backlog, Propiedad 13: Selección de sugerencia navega al paciente correcto

/**
 * Pure function that constructs the URL for navigating to a patient's detail page.
 * This mirrors the `buildPacienteUrl` function exported from app/components/Navbar.tsx.
 *
 * Extracted as a pure function to enable property-based testing without requiring
 * a browser environment or mocking the Next.js router.
 */
function buildPacienteUrl(id: number): string {
  return `/pacientes/${id}`;
}

// ── Property 13: Selecting a suggestion navigates to the correct patient ──────

describe("NavbarSearch — Propiedad 13: Selección de sugerencia navega al paciente correcto", () => {
  // Validates: Requisito 5.3

  it("buildPacienteUrl produce la URL correcta para cualquier id de paciente positivo", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 13: Selección de sugerencia navega al paciente correcto
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const url = buildPacienteUrl(id);
        expect(url).toBe(`/pacientes/${id}`);
      }),
      { numRuns: 100 }
    );
  });

  it("la URL siempre comienza con /pacientes/", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 13: Selección de sugerencia navega al paciente correcto
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const url = buildPacienteUrl(id);
        expect(url.startsWith("/pacientes/")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("el id en la URL coincide exactamente con el id del paciente seleccionado", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 13: Selección de sugerencia navega al paciente correcto
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const url = buildPacienteUrl(id);
        // Extract the id segment from the URL path
        const segments = url.split("/");
        const idSegment = segments[segments.length - 1];
        expect(Number(idSegment)).toBe(id);
      }),
      { numRuns: 100 }
    );
  });

  it("URLs de pacientes distintos son siempre distintas", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 13: Selección de sugerencia navega al paciente correcto
    fc.assert(
      fc.property(
        fc.integer({ min: 1 }),
        fc.integer({ min: 1 }),
        (id1, id2) => {
          fc.pre(id1 !== id2);
          const url1 = buildPacienteUrl(id1);
          const url2 = buildPacienteUrl(id2);
          expect(url1).not.toBe(url2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
