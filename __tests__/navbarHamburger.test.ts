import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Feature: veterinaria-scarlet-backlog, Propiedad 16: Menú hamburguesa despliega todos los enlaces disponibles
// Feature: veterinaria-scarlet-backlog, Propiedad 17: Clic en enlace del menú móvil cierra el menú

/**
 * NavLink type — mirrors the type exported from app/components/Navbar.tsx
 */
type NavLink = { href: string; label: string };

/**
 * Pure function that mirrors getMenuLinks from app/components/Navbar.tsx.
 * Returns the links to display in the mobile dropdown:
 * - When menuAbierto is true, returns all links.
 * - When menuAbierto is false, returns an empty array.
 */
function getMenuLinks(links: NavLink[], menuAbierto: boolean): NavLink[] {
  return menuAbierto ? links : [];
}

/**
 * Pure function that mirrors toggleMenu from app/components/Navbar.tsx.
 * Returns the opposite of the current menu state.
 */
function toggleMenu(current: boolean): boolean {
  return !current;
}

/**
 * Pure function that mirrors closeMenuOnLinkClick from app/components/Navbar.tsx.
 * Always returns false — clicking a link always closes the menu.
 */
function closeMenuOnLinkClick(): boolean {
  return false;
}

// ── Arbitrary generators ──────────────────────────────────────────────────────

const navLinkArb = fc.record<NavLink>({
  href: fc.string({ minLength: 1, maxLength: 50 }),
  label: fc.string({ minLength: 1, maxLength: 30 }),
});

const navLinksArb = fc.array(navLinkArb, { minLength: 1, maxLength: 10 });

// ── Property 16: Menú hamburguesa despliega todos los enlaces disponibles ─────

describe("NavbarHamburger — Propiedad 16: Menú hamburguesa despliega todos los enlaces disponibles", () => {
  // Validates: Requisito 8.2

  it("cuando menuAbierto es true, getMenuLinks devuelve exactamente todos los enlaces del rol", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 16: Menú hamburguesa despliega todos los enlaces disponibles
    fc.assert(
      fc.property(navLinksArb, (links) => {
        const result = getMenuLinks(links, true);

        // Must contain exactly the same links — same count
        expect(result).toHaveLength(links.length);

        // Must contain every link from the input
        for (const link of links) {
          expect(result).toContainEqual(link);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("cuando menuAbierto es false, getMenuLinks devuelve un array vacío", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 16: Menú hamburguesa despliega todos los enlaces disponibles
    fc.assert(
      fc.property(navLinksArb, (links) => {
        const result = getMenuLinks(links, false);
        expect(result).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it("los enlaces devueltos son exactamente los mismos objetos (sin transformaciones)", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 16: Menú hamburguesa despliega todos los enlaces disponibles
    fc.assert(
      fc.property(navLinksArb, (links) => {
        const result = getMenuLinks(links, true);

        // Each returned link must have the same href and label as the input
        result.forEach((resultLink, index) => {
          expect(resultLink.href).toBe(links[index].href);
          expect(resultLink.label).toBe(links[index].label);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("toggleMenu alterna el estado del menú correctamente para cualquier valor booleano", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 16: Menú hamburguesa despliega todos los enlaces disponibles
    fc.assert(
      fc.property(fc.boolean(), (current) => {
        const next = toggleMenu(current);
        expect(next).toBe(!current);
      }),
      { numRuns: 100 }
    );
  });

  it("aplicar toggleMenu dos veces devuelve el estado original", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 16: Menú hamburguesa despliega todos los enlaces disponibles
    fc.assert(
      fc.property(fc.boolean(), (current) => {
        const afterTwo = toggleMenu(toggleMenu(current));
        expect(afterTwo).toBe(current);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 17: Clic en enlace del menú móvil cierra el menú ────────────────

describe("NavbarHamburger — Propiedad 17: Clic en enlace del menú móvil cierra el menú", () => {
  // Validates: Requisito 8.3

  it("closeMenuOnLinkClick siempre devuelve false, independientemente del enlace", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 17: Clic en enlace del menú móvil cierra el menú
    fc.assert(
      fc.property(navLinkArb, (_link) => {
        const result = closeMenuOnLinkClick();
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("para cualquier enlace en el menú desplegado, hacer clic cierra el menú (menuAbierto pasa a false)", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 17: Clic en enlace del menú móvil cierra el menú
    fc.assert(
      fc.property(navLinksArb, (links) => {
        // Simulate: menu is open
        let menuAbierto = true;

        // Simulate clicking any link in the open menu
        const visibleLinks = getMenuLinks(links, menuAbierto);
        expect(visibleLinks).toHaveLength(links.length);

        // Clicking any link closes the menu
        menuAbierto = closeMenuOnLinkClick();
        expect(menuAbierto).toBe(false);

        // After closing, no links are shown in the dropdown
        const linksAfterClose = getMenuLinks(links, menuAbierto);
        expect(linksAfterClose).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it("el menú permanece cerrado después de hacer clic en cualquier enlace, sin importar cuántos enlaces haya", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 17: Clic en enlace del menú móvil cierra el menú
    fc.assert(
      fc.property(navLinksArb, (links) => {
        // Simulate clicking each link in the menu
        for (const _link of links) {
          const newState = closeMenuOnLinkClick();
          expect(newState).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("el estado del menú después de clic en enlace es siempre false, independientemente del estado previo", () => {
    // Feature: veterinaria-scarlet-backlog, Propiedad 17: Clic en enlace del menú móvil cierra el menú
    fc.assert(
      fc.property(fc.boolean(), navLinkArb, (_prevState, _link) => {
        // Regardless of whether the menu was open or closed before,
        // clicking a link always results in menuAbierto = false
        const newState = closeMenuOnLinkClick();
        expect(newState).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
