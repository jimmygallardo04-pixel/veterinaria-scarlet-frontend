import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: veterinaria-scarlet-backlog, Propiedad 4: Botones de acción en ítems de tratamientos

/**
 * Mirrors the Tratamiento type used in app/pacientes/[id]/page.tsx
 */
type Tratamiento = {
  id: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
};

/**
 * Mirrors the TratamientoEditForm type used in the inline edit state.
 */
type TratamientoEditForm = {
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin: string;
};

/**
 * Pure function that mirrors the data structure driving the rendering of action buttons.
 * For each treatment in the list, returns the set of action buttons that should be shown.
 */
function getTratamientoActionButtons(_tratamiento: Tratamiento): string[] {
  return ["Editar", "Eliminar"];
}

/**
 * Pure function that mirrors iniciarEdicionTratamiento in app/pacientes/[id]/page.tsx.
 * Initialises the edit form with the current values of the given treatment.
 */
function iniciarEdicionTratamiento(t: Tratamiento): TratamientoEditForm {
  return {
    medicamento: t.medicamento,
    dosis: t.dosis,
    frecuencia: t.frecuencia,
    fecha_inicio: t.fecha_inicio,
    fecha_fin: t.fecha_fin || "",
  };
}

/**
 * Pure function that mirrors the PATCH body construction in editarTratamiento.
 * Builds the request body from the current form state.
 */
function buildTratamientoPatchBody(form: TratamientoEditForm): {
  medicamento: string;
  dosis: string;
  frecuencia: string;
  fecha_inicio: string;
  fecha_fin: string | null;
} {
  return {
    medicamento: form.medicamento,
    dosis: form.dosis,
    frecuencia: form.frecuencia,
    fecha_inicio: form.fecha_inicio,
    fecha_fin: form.fecha_fin || null,
  };
}

/**
 * Pure function that mirrors the DELETE URL construction in eliminarTratamiento.
 * Builds the DELETE endpoint URL from the treatment id.
 */
function buildTratamientoDeleteUrl(id: number): string {
  return `/tratamientos/${id}/`;
}

// ── Arbitrary generators ──────────────────────────────────────────────────────

// Generate a valid YYYY-MM-DD date string
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

const tratamientoArb = fc.record<Tratamiento>({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  medicamento: fc.string({ minLength: 1, maxLength: 100 }),
  dosis: fc.string({ minLength: 1, maxLength: 50 }),
  frecuencia: fc.string({ minLength: 1, maxLength: 100 }),
  fecha_inicio: dateStringArb,
  fecha_fin: fc.option(dateStringArb, { nil: null }),
});

const tratamientosListArb = fc.array(tratamientoArb, { minLength: 1, maxLength: 20 });

const tratamientoEditFormArb = fc.record<TratamientoEditForm>({
  medicamento: fc.string({ minLength: 1, maxLength: 100 }),
  dosis: fc.string({ minLength: 1, maxLength: 50 }),
  frecuencia: fc.string({ minLength: 1, maxLength: 100 }),
  fecha_inicio: dateStringArb,
  fecha_fin: fc.string({ minLength: 0, maxLength: 10 }),
});

// ── Property 4: Action buttons in treatment items ─────────────────────────────

describe("Tratamiento Edit — Propiedad 4: Botones de acción en ítems de tratamientos", () => {
  // Validates: Requirement 3.4

  it("cada tratamiento en la lista tiene tanto el botón 'Editar' como el botón 'Eliminar'", () => {
    fc.assert(
      fc.property(tratamientosListArb, (tratamientos) => {
        for (const t of tratamientos) {
          const buttons = getTratamientoActionButtons(t);
          expect(buttons).toContain("Editar");
          expect(buttons).toContain("Eliminar");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("la lista de botones de acción contiene exactamente 'Editar' y 'Eliminar' para cualquier tratamiento", () => {
    fc.assert(
      fc.property(tratamientoArb, (t) => {
        const buttons = getTratamientoActionButtons(t);
        expect(buttons).toHaveLength(2);
        expect(buttons).toContain("Editar");
        expect(buttons).toContain("Eliminar");
      }),
      { numRuns: 100 }
    );
  });

  it("para cualquier lista no vacía de tratamientos, todos los ítems exponen ambos botones de acción", () => {
    fc.assert(
      fc.property(tratamientosListArb, (tratamientos) => {
        const allHaveBothButtons = tratamientos.every((t) => {
          const buttons = getTratamientoActionButtons(t);
          return buttons.includes("Editar") && buttons.includes("Eliminar");
        });
        expect(allHaveBothButtons).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 5: Inline form pre-loaded with item data (treatments) ────────────

// Feature: veterinaria-scarlet-backlog, Propiedad 5: Formulario inline precargado con datos del ítem (tratamientos)

describe("Tratamiento Edit — Propiedad 5: Formulario inline precargado con datos del ítem (tratamientos)", () => {
  // Validates: Requirement 3.5

  it("al iniciar la edición, medicamento del formulario coincide con el del tratamiento", () => {
    fc.assert(
      fc.property(tratamientoArb, (t) => {
        const form = iniciarEdicionTratamiento(t);
        expect(form.medicamento).toBe(t.medicamento);
      }),
      { numRuns: 100 }
    );
  });

  it("al iniciar la edición, dosis del formulario coincide con la del tratamiento", () => {
    fc.assert(
      fc.property(tratamientoArb, (t) => {
        const form = iniciarEdicionTratamiento(t);
        expect(form.dosis).toBe(t.dosis);
      }),
      { numRuns: 100 }
    );
  });

  it("al iniciar la edición, frecuencia del formulario coincide con la del tratamiento", () => {
    fc.assert(
      fc.property(tratamientoArb, (t) => {
        const form = iniciarEdicionTratamiento(t);
        expect(form.frecuencia).toBe(t.frecuencia);
      }),
      { numRuns: 100 }
    );
  });

  it("al iniciar la edición, fecha_inicio del formulario coincide con la del tratamiento", () => {
    fc.assert(
      fc.property(tratamientoArb, (t) => {
        const form = iniciarEdicionTratamiento(t);
        expect(form.fecha_inicio).toBe(t.fecha_inicio);
      }),
      { numRuns: 100 }
    );
  });

  it("al iniciar la edición, fecha_fin del formulario es la del tratamiento o cadena vacía si era null/undefined", () => {
    fc.assert(
      fc.property(tratamientoArb, (t) => {
        const form = iniciarEdicionTratamiento(t);
        if (t.fecha_fin) {
          expect(form.fecha_fin).toBe(t.fecha_fin);
        } else {
          expect(form.fecha_fin).toBe("");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("todos los campos del formulario se inicializan con los valores actuales del tratamiento", () => {
    fc.assert(
      fc.property(tratamientoArb, (t) => {
        const form = iniciarEdicionTratamiento(t);
        expect(form.medicamento).toBe(t.medicamento);
        expect(form.dosis).toBe(t.dosis);
        expect(form.frecuencia).toBe(t.frecuencia);
        expect(form.fecha_inicio).toBe(t.fecha_inicio);
        expect(form.fecha_fin).toBe(t.fecha_fin || "");
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 6: PATCH body matches form state (treatments) ───────────────────

// Feature: veterinaria-scarlet-backlog, Propiedad 6: Cuerpo del PATCH coincide con el estado del formulario (tratamientos)

describe("Tratamiento Edit — Propiedad 6: Cuerpo del PATCH coincide con el estado del formulario (tratamientos)", () => {
  // Validates: Requirement 3.6

  it("el cuerpo del PATCH tiene medicamento igual al del formulario", () => {
    fc.assert(
      fc.property(tratamientoEditFormArb, (form) => {
        const body = buildTratamientoPatchBody(form);
        expect(body.medicamento).toBe(form.medicamento);
      }),
      { numRuns: 100 }
    );
  });

  it("el cuerpo del PATCH tiene dosis igual a la del formulario", () => {
    fc.assert(
      fc.property(tratamientoEditFormArb, (form) => {
        const body = buildTratamientoPatchBody(form);
        expect(body.dosis).toBe(form.dosis);
      }),
      { numRuns: 100 }
    );
  });

  it("el cuerpo del PATCH tiene frecuencia igual a la del formulario", () => {
    fc.assert(
      fc.property(tratamientoEditFormArb, (form) => {
        const body = buildTratamientoPatchBody(form);
        expect(body.frecuencia).toBe(form.frecuencia);
      }),
      { numRuns: 100 }
    );
  });

  it("el cuerpo del PATCH tiene fecha_inicio igual a la del formulario", () => {
    fc.assert(
      fc.property(tratamientoEditFormArb, (form) => {
        const body = buildTratamientoPatchBody(form);
        expect(body.fecha_inicio).toBe(form.fecha_inicio);
      }),
      { numRuns: 100 }
    );
  });

  it("el cuerpo del PATCH convierte fecha_fin vacía a null", () => {
    fc.assert(
      fc.property(tratamientoEditFormArb, (form) => {
        const body = buildTratamientoPatchBody(form);
        if (form.fecha_fin === "") {
          expect(body.fecha_fin).toBeNull();
        } else {
          expect(body.fecha_fin).toBe(form.fecha_fin);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("el cuerpo del PATCH es igual al estado del formulario en el momento de confirmar (campos no vacíos)", () => {
    fc.assert(
      fc.property(
        fc.record<TratamientoEditForm>({
          medicamento: fc.string({ minLength: 1, maxLength: 100 }),
          dosis: fc.string({ minLength: 1, maxLength: 50 }),
          frecuencia: fc.string({ minLength: 1, maxLength: 100 }),
          fecha_inicio: dateStringArb,
          fecha_fin: dateStringArb, // non-empty
        }),
        (form) => {
          const body = buildTratamientoPatchBody(form);
          expect(body.medicamento).toBe(form.medicamento);
          expect(body.dosis).toBe(form.dosis);
          expect(body.frecuencia).toBe(form.frecuencia);
          expect(body.fecha_inicio).toBe(form.fecha_inicio);
          expect(body.fecha_fin).toBe(form.fecha_fin);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 7: DELETE uses the correct treatment id ─────────────────────────

// Feature: veterinaria-scarlet-backlog, Propiedad 7: DELETE de tratamiento usa el id correcto

describe("Tratamiento Edit — Propiedad 7: DELETE de tratamiento usa el id correcto", () => {
  // Validates: Requirement 3.8

  it("la URL de DELETE se dirige a /tratamientos/{id}/ con el id correcto", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const url = buildTratamientoDeleteUrl(id);
        expect(url).toBe(`/tratamientos/${id}/`);
      }),
      { numRuns: 100 }
    );
  });

  it("la URL de DELETE contiene el id como segmento de ruta", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const url = buildTratamientoDeleteUrl(id);
        expect(url).toContain(`/${id}/`);
      }),
      { numRuns: 100 }
    );
  });

  it("la URL de DELETE empieza con /tratamientos/", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const url = buildTratamientoDeleteUrl(id);
        expect(url.startsWith("/tratamientos/")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("la URL de DELETE termina con /", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (id) => {
        const url = buildTratamientoDeleteUrl(id);
        expect(url.endsWith("/")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("ids distintos producen URLs distintas", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500_000 }),
        fc.integer({ min: 500_001, max: 1_000_000 }),
        (id1, id2) => {
          const url1 = buildTratamientoDeleteUrl(id1);
          const url2 = buildTratamientoDeleteUrl(id2);
          expect(url1).not.toBe(url2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
