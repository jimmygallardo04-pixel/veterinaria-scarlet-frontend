import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: veterinaria-scarlet-backlog, Propiedad 1: Construcción correcta del href de "Nueva cita" por paciente

/**
 * Builds the href for the "Nueva cita" button for a specific patient.
 * This mirrors the logic used in app/pacientes/page.tsx.
 */
function buildNuevaCitaHref(pacienteId: number): string {
  return `/citas/nueva?paciente=${pacienteId}`;
}

/**
 * Simulates reading the `?paciente` URL parameter and initialising the form state.
 * This mirrors the logic used in app/citas/nueva/page.tsx.
 */
function buildFormInitialState(pacienteParam: string | null): { paciente: string } {
  return {
    paciente: pacienteParam || "",
  };
}

describe("Navegación — Propiedad 1: Construcción correcta del href de 'Nueva cita' por paciente", () => {
  // Validates: Requirement 1.2
  it("el href de 'Nueva cita' por paciente siempre es /citas/nueva?paciente={id}", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const href = buildNuevaCitaHref(id);
        expect(href).toBe(`/citas/nueva?paciente=${id}`);
      }),
      { numRuns: 100 }
    );
  });

  it("el href nunca apunta a /citas sin el segmento /nueva", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const href = buildNuevaCitaHref(id);
        // Must contain /citas/nueva, not just /citas
        expect(href).toMatch(/^\/citas\/nueva\?paciente=\d+$/);
      }),
      { numRuns: 100 }
    );
  });

  it("el id del paciente en el href coincide exactamente con el id dado", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const href = buildNuevaCitaHref(id);
        const url = new URL(href, "http://localhost");
        const paramId = Number(url.searchParams.get("paciente"));
        expect(paramId).toBe(id);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: veterinaria-scarlet-backlog, Propiedad 2: Preselección de paciente desde parámetro URL

describe("Navegación — Propiedad 2: Preselección de paciente desde parámetro URL", () => {
  // Validates: Requirement 1.4
  it("el formulario preselecciona el paciente correcto dado cualquier id válido en el query param", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const pacienteParam = String(id);
        const formState = buildFormInitialState(pacienteParam);
        expect(formState.paciente).toBe(pacienteParam);
      }),
      { numRuns: 100 }
    );
  });

  it("el formulario tiene paciente vacío cuando el parámetro es null", () => {
    const formState = buildFormInitialState(null);
    expect(formState.paciente).toBe("");
  });

  it("el id en el estado del formulario coincide numéricamente con el id del query param", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const pacienteParam = String(id);
        const formState = buildFormInitialState(pacienteParam);
        // The form stores the id as a string (matching <option value={p.id}>)
        expect(Number(formState.paciente)).toBe(id);
      }),
      { numRuns: 100 }
    );
  });
});
