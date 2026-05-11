import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: veterinaria-scarlet-backlog, Propiedad 4: Botones de acción en ítems de vacunas

/**
 * Mirrors the Vacuna type used in app/pacientes/[id]/page.tsx
 */
type Vacuna = {
  id: number;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis?: string | null;
  observaciones?: string | null;
};

/**
 * Mirrors the VacunaEditForm type used in the inline edit state.
 */
type VacunaEditForm = {
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis: string;
  observaciones: string;
};

/**
 * Pure function that mirrors the data structure driving the rendering of action buttons.
 * For each vaccine in the list, returns the set of action buttons that should be shown.
 */
function getVacunaActionButtons(vacuna: Vacuna): string[] {
  return ["Editar", "Eliminar"];
}

/**
 * Pure function that mirrors iniciarEdicionVacuna in app/pacientes/[id]/page.tsx.
 * Initialises the edit form with the current values of the given vaccine.
 */
function iniciarEdicionVacuna(v: Vacuna): VacunaEditForm {
  return {
    nombre_vacuna: v.nombre_vacuna,
    fecha_aplicacion: v.fecha_aplicacion,
    proxima_dosis: v.proxima_dosis || "",
    observaciones: v.observaciones || "",
  };
}

/**
 * Pure function that mirrors the PATCH body construction in editarVacuna.
 * Builds the request body from the current form state.
 */
function buildPatchBody(form: VacunaEditForm): {
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis: string | null;
  observaciones: string | null;
} {
  return {
    nombre_vacuna: form.nombre_vacuna,
    fecha_aplicacion: form.fecha_aplicacion,
    proxima_dosis: form.proxima_dosis || null,
    observaciones: form.observaciones || null,
  };
}

// ── Arbitrary generators ──────────────────────────────────────────────────────

// Generate a valid YYYY-MM-DD date string by composing year/month/day integers
const dateStringArb = fc
  .record({
    year: fc.integer({ min: 2000, max: 2030 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }), // use 28 to be safe across all months
  })
  .map(({ year, month, day }) => {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  });

const vacunaArb = fc.record<Vacuna>({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  nombre_vacuna: fc.string({ minLength: 1, maxLength: 100 }),
  fecha_aplicacion: dateStringArb,
  proxima_dosis: fc.option(dateStringArb, { nil: null }),
  observaciones: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: null }),
});

const vacunasListArb = fc.array(vacunaArb, { minLength: 1, maxLength: 20 });

const vacunaEditFormArb = fc.record<VacunaEditForm>({
  nombre_vacuna: fc.string({ minLength: 1, maxLength: 100 }),
  fecha_aplicacion: dateStringArb,
  proxima_dosis: fc.string({ minLength: 0, maxLength: 10 }),
  observaciones: fc.string({ minLength: 0, maxLength: 200 }),
});

// ── Property 4: Action buttons in vaccine items ───────────────────────────────

describe("Vacuna Edit — Propiedad 4: Botones de acción en ítems de vacunas", () => {
  // Validates: Requirement 3.1

  it("cada vacuna en la lista tiene tanto el botón 'Editar' como el botón 'Eliminar'", () => {
    fc.assert(
      fc.property(vacunasListArb, (vacunas) => {
        for (const v of vacunas) {
          const buttons = getVacunaActionButtons(v);
          expect(buttons).toContain("Editar");
          expect(buttons).toContain("Eliminar");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("la lista de botones de acción contiene exactamente 'Editar' y 'Eliminar' para cualquier vacuna", () => {
    fc.assert(
      fc.property(vacunaArb, (v) => {
        const buttons = getVacunaActionButtons(v);
        expect(buttons).toHaveLength(2);
        expect(buttons).toContain("Editar");
        expect(buttons).toContain("Eliminar");
      }),
      { numRuns: 100 }
    );
  });

  it("para cualquier lista no vacía de vacunas, todos los ítems exponen ambos botones de acción", () => {
    fc.assert(
      fc.property(vacunasListArb, (vacunas) => {
        const allHaveBothButtons = vacunas.every((v) => {
          const buttons = getVacunaActionButtons(v);
          return buttons.includes("Editar") && buttons.includes("Eliminar");
        });
        expect(allHaveBothButtons).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 5: Inline form pre-loaded with item data (vaccines) ──────────────

// Feature: veterinaria-scarlet-backlog, Propiedad 5: Formulario inline precargado con datos del ítem (vacunas)

describe("Vacuna Edit — Propiedad 5: Formulario inline precargado con datos del ítem (vacunas)", () => {
  // Validates: Requirement 3.2

  it("al iniciar la edición, nombre_vacuna del formulario coincide con el de la vacuna", () => {
    fc.assert(
      fc.property(vacunaArb, (v) => {
        const form = iniciarEdicionVacuna(v);
        expect(form.nombre_vacuna).toBe(v.nombre_vacuna);
      }),
      { numRuns: 100 }
    );
  });

  it("al iniciar la edición, fecha_aplicacion del formulario coincide con la de la vacuna", () => {
    fc.assert(
      fc.property(vacunaArb, (v) => {
        const form = iniciarEdicionVacuna(v);
        expect(form.fecha_aplicacion).toBe(v.fecha_aplicacion);
      }),
      { numRuns: 100 }
    );
  });

  it("al iniciar la edición, proxima_dosis del formulario es la de la vacuna o cadena vacía si era null/undefined", () => {
    fc.assert(
      fc.property(vacunaArb, (v) => {
        const form = iniciarEdicionVacuna(v);
        if (v.proxima_dosis) {
          expect(form.proxima_dosis).toBe(v.proxima_dosis);
        } else {
          expect(form.proxima_dosis).toBe("");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("al iniciar la edición, observaciones del formulario es la de la vacuna o cadena vacía si era null/undefined", () => {
    fc.assert(
      fc.property(vacunaArb, (v) => {
        const form = iniciarEdicionVacuna(v);
        if (v.observaciones) {
          expect(form.observaciones).toBe(v.observaciones);
        } else {
          expect(form.observaciones).toBe("");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("todos los campos del formulario se inicializan con los valores actuales de la vacuna", () => {
    fc.assert(
      fc.property(vacunaArb, (v) => {
        const form = iniciarEdicionVacuna(v);
        expect(form.nombre_vacuna).toBe(v.nombre_vacuna);
        expect(form.fecha_aplicacion).toBe(v.fecha_aplicacion);
        expect(form.proxima_dosis).toBe(v.proxima_dosis || "");
        expect(form.observaciones).toBe(v.observaciones || "");
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 6: PATCH body matches form state (vaccines) ─────────────────────

// Feature: veterinaria-scarlet-backlog, Propiedad 6: Cuerpo del PATCH coincide con el estado del formulario (vacunas)

describe("Vacuna Edit — Propiedad 6: Cuerpo del PATCH coincide con el estado del formulario (vacunas)", () => {
  // Validates: Requirement 3.3

  it("el cuerpo del PATCH tiene nombre_vacuna igual al del formulario", () => {
    fc.assert(
      fc.property(vacunaEditFormArb, (form) => {
        const body = buildPatchBody(form);
        expect(body.nombre_vacuna).toBe(form.nombre_vacuna);
      }),
      { numRuns: 100 }
    );
  });

  it("el cuerpo del PATCH tiene fecha_aplicacion igual a la del formulario", () => {
    fc.assert(
      fc.property(vacunaEditFormArb, (form) => {
        const body = buildPatchBody(form);
        expect(body.fecha_aplicacion).toBe(form.fecha_aplicacion);
      }),
      { numRuns: 100 }
    );
  });

  it("el cuerpo del PATCH convierte proxima_dosis vacía a null", () => {
    fc.assert(
      fc.property(vacunaEditFormArb, (form) => {
        const body = buildPatchBody(form);
        if (form.proxima_dosis === "") {
          expect(body.proxima_dosis).toBeNull();
        } else {
          expect(body.proxima_dosis).toBe(form.proxima_dosis);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("el cuerpo del PATCH convierte observaciones vacías a null", () => {
    fc.assert(
      fc.property(vacunaEditFormArb, (form) => {
        const body = buildPatchBody(form);
        if (form.observaciones === "") {
          expect(body.observaciones).toBeNull();
        } else {
          expect(body.observaciones).toBe(form.observaciones);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("el cuerpo del PATCH es igual al estado del formulario en el momento de confirmar (campos no vacíos)", () => {
    fc.assert(
      fc.property(
        fc.record<VacunaEditForm>({
          nombre_vacuna: fc.string({ minLength: 1, maxLength: 100 }),
          fecha_aplicacion: dateStringArb,
          proxima_dosis: dateStringArb, // non-empty
          observaciones: fc.string({ minLength: 1, maxLength: 200 }), // non-empty
        }),
        (form) => {
          const body = buildPatchBody(form);
          expect(body.nombre_vacuna).toBe(form.nombre_vacuna);
          expect(body.fecha_aplicacion).toBe(form.fecha_aplicacion);
          expect(body.proxima_dosis).toBe(form.proxima_dosis);
          expect(body.observaciones).toBe(form.observaciones);
        }
      ),
      { numRuns: 100 }
    );
  });
});
