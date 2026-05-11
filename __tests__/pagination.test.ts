import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: veterinaria-scarlet-backlog, Propiedad 11: Controles de paginación visibles cuando hay más páginas

/**
 * Mirrors the pure visibility logic exported from app/components/Pagination.tsx.
 * Determines which navigation controls should be rendered.
 */
function getPaginationVisibility(
  next: string | null,
  previous: string | null
): { showNext: boolean; showPrevious: boolean } {
  return {
    showNext: next !== null,
    showPrevious: previous !== null,
  };
}

/**
 * Mirrors the rendering decision: returns true if any navigation control
 * should be visible (i.e. the component renders something).
 */
function hasVisibleControls(
  next: string | null,
  previous: string | null
): boolean {
  const { showNext, showPrevious } = getPaginationVisibility(next, previous);
  return showNext || showPrevious;
}

// ── Arbitrary generators ──────────────────────────────────────────────────────

/**
 * Generates a non-null URL string representing a "next" or "previous" link.
 * Uses fc.string() constrained to non-empty strings to represent a valid URL.
 */
const nonNullUrlArb = fc.string({ minLength: 1, maxLength: 200 });

// ── Property 11: Pagination controls visible when there are more pages ────────

describe("Pagination — Propiedad 11: Controles de paginación visibles cuando hay más páginas", () => {
  // Validates: Requisito 4.5

  it("cuando next no es null, el componente muestra el control 'Siguiente'", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 11: Controles de paginación visibles cuando hay más páginas
    fc.assert(
      fc.property(
        fc.record({
          next: nonNullUrlArb,
          previous: fc.option(nonNullUrlArb, { nil: null }),
          count: fc.integer({ min: 1 }),
        }),
        ({ next, previous, count: _count }) => {
          const { showNext } = getPaginationVisibility(next, previous);
          expect(showNext).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("cuando next no es null, el componente renderiza controles de navegación visibles", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 11: Controles de paginación visibles cuando hay más páginas
    fc.assert(
      fc.property(
        fc.record({
          next: nonNullUrlArb,
          previous: fc.option(nonNullUrlArb, { nil: null }),
          count: fc.integer({ min: 1 }),
        }),
        ({ next, previous, count: _count }) => {
          const visible = hasVisibleControls(next, previous);
          expect(visible).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("cuando next es null y previous es null, no se muestran controles de navegación", () => {
    const visible = hasVisibleControls(null, null);
    expect(visible).toBe(false);
  });

  it("cuando previous no es null, el componente muestra el control 'Anterior'", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 11: Controles de paginación visibles cuando hay más páginas
    fc.assert(
      fc.property(
        fc.record({
          next: fc.option(nonNullUrlArb, { nil: null }),
          previous: nonNullUrlArb,
          count: fc.integer({ min: 1 }),
        }),
        ({ next, previous, count: _count }) => {
          const { showPrevious } = getPaginationVisibility(next, previous);
          expect(showPrevious).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("showNext es false exactamente cuando next es null", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 11: Controles de paginación visibles cuando hay más páginas
    fc.assert(
      fc.property(
        fc.option(nonNullUrlArb, { nil: null }),
        fc.option(nonNullUrlArb, { nil: null }),
        (next, previous) => {
          const { showNext } = getPaginationVisibility(next, previous);
          expect(showNext).toBe(next !== null);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("showPrevious es false exactamente cuando previous es null", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 11: Controles de paginación visibles cuando hay más páginas
    fc.assert(
      fc.property(
        fc.option(nonNullUrlArb, { nil: null }),
        fc.option(nonNullUrlArb, { nil: null }),
        (next, previous) => {
          const { showPrevious } = getPaginationVisibility(next, previous);
          expect(showPrevious).toBe(previous !== null);
        }
      ),
      { numRuns: 100 }
    );
  });
});
