import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: veterinaria-scarlet-backlog, Propiedad 15: Información del paciente visible al seleccionar en formulario de edición de ficha

/**
 * Mirrors the Paciente type used in app/fichas/[id]/editar/page.tsx
 */
type Paciente = {
  id: number;
  nombre: string;
  tutor_nombre: string;
  especie_nombre?: string;
};

/**
 * Pure function that mirrors the useMemo logic in the edit form:
 *   pacientes.find((p) => String(p.id) === form.paciente) ?? null
 */
function derivarPacienteSeleccionado(
  pacientes: Paciente[],
  formPaciente: string
): Paciente | null {
  return pacientes.find((p) => String(p.id) === formPaciente) ?? null;
}

// Arbitrary generator for a single Paciente
const pacienteArb = fc.record<Paciente>({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  nombre: fc.string({ minLength: 1, maxLength: 50 }),
  tutor_nombre: fc.string({ minLength: 1, maxLength: 50 }),
  especie_nombre: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
});

// Arbitrary generator for a non-empty list of Pacientes with unique ids
const pacientesListArb = fc
  .array(pacienteArb, { minLength: 1, maxLength: 20 })
  .map((list) => {
    // Deduplicate by id to avoid ambiguity in find()
    const seen = new Set<number>();
    return list.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  })
  .filter((list) => list.length > 0);

describe("Ficha Edit — Propiedad 15: Información del paciente visible al seleccionar en formulario de edición de ficha", () => {
  // Validates: Requirements 7.1, 7.2

  it("dado cualquier paciente en la lista, derivarPacienteSeleccionado devuelve ese paciente con especie_nombre y tutor_nombre correctos", () => {
    fc.assert(
      fc.property(pacientesListArb, (pacientes) => {
        // Pick any patient from the list (use the first one for determinism)
        const target = pacientes[0];
        const formPaciente = String(target.id);

        const resultado = derivarPacienteSeleccionado(pacientes, formPaciente);

        // The patient must be found
        expect(resultado).not.toBeNull();
        expect(resultado!.id).toBe(target.id);
        expect(resultado!.tutor_nombre).toBe(target.tutor_nombre);
        expect(resultado!.especie_nombre).toBe(target.especie_nombre);
      }),
      { numRuns: 100 }
    );
  });

  it("al cargar la página con un paciente ya asignado, el paciente derivado tiene los datos correctos (simula carga inicial)", () => {
    fc.assert(
      fc.property(pacientesListArb, (pacientes) => {
        // Simulate page load: form.paciente is pre-filled with the id of a patient in the list
        const assignedPatient = pacientes[Math.floor(pacientes.length / 2)];
        const formPaciente = String(assignedPatient.id);

        const resultado = derivarPacienteSeleccionado(pacientes, formPaciente);

        expect(resultado).not.toBeNull();
        expect(resultado!.tutor_nombre).toBe(assignedPatient.tutor_nombre);
        // especie_nombre may be undefined but must match
        expect(resultado!.especie_nombre).toBe(assignedPatient.especie_nombre);
      }),
      { numRuns: 100 }
    );
  });

  it("cuando form.paciente está vacío, derivarPacienteSeleccionado devuelve null (sección oculta)", () => {
    fc.assert(
      fc.property(pacientesListArb, (pacientes) => {
        const resultado = derivarPacienteSeleccionado(pacientes, "");
        expect(resultado).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("cuando form.paciente no coincide con ningún id de la lista, devuelve null", () => {
    fc.assert(
      fc.property(pacientesListArb, (pacientes) => {
        // Use an id that is guaranteed not to be in the list
        const maxId = Math.max(...pacientes.map((p) => p.id));
        const nonExistentId = String(maxId + 1);

        const resultado = derivarPacienteSeleccionado(pacientes, nonExistentId);
        expect(resultado).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("la comparación usa String(p.id) === form.paciente, por lo que ids numéricos y strings coinciden correctamente", () => {
    fc.assert(
      fc.property(pacientesListArb, (pacientes) => {
        const target = pacientes[0];

        // Passing the id as a string (as the form stores it)
        const resultadoString = derivarPacienteSeleccionado(pacientes, String(target.id));
        expect(resultadoString).not.toBeNull();
        expect(resultadoString!.id).toBe(target.id);
      }),
      { numRuns: 100 }
    );
  });
});
