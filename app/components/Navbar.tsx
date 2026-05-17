"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiFetch, type PaginatedResponse } from "@/lib/api";
import { useUser } from "@/lib/useUser";
import { clearSession } from "@/lib/session";
import { APP_NAME, APP_EMOJI, SEARCH_SUGGESTIONS_LIMIT, SEARCH_DEBOUNCE_MS } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tutores", label: "Tutores" },
  { href: "/pacientes", label: "Pacientes" },
  { href: "/citas", label: "Citas" },
  { href: "/fichas", label: "Fichas" },
];

// Solo visible para admins
const ADMIN_LINKS = [
  { href: "/configuracion", label: "Configuración" },
];

type PacienteSugerencia = {
  id: number;
  nombre: string;
  especie_nombre?: string;
  tutor_nombre?: string;
};

/**
 * Constructs the URL for navigating to a patient's detail page.
 * Exported as a pure function to enable property-based testing.
 */
export function buildPacienteUrl(id: number): string {
  return `/pacientes/${id}`;
}

// ── Pure functions for hamburger menu logic (exported for PBT) ───────────────

export type NavLink = { href: string; label: string };

/**
 * Returns the links to display in the mobile dropdown.
 * When the menu is open, returns all links; when closed, returns an empty array.
 */
export function getMenuLinks(links: NavLink[], menuAbierto: boolean): NavLink[] {
  return menuAbierto ? links : [];
}

/**
 * Toggles the menu open/closed state.
 */
export function toggleMenu(current: boolean): boolean {
  return !current;
}

/**
 * Returns the menu state after clicking a link — always false (menu closes).
 */
export function closeMenuOnLinkClick(): boolean {
  return false;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useUser();

  // ── Global search state ──────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [sugerencias, setSugerencias] = useState<PacienteSugerencia[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce: call backend after the user stops typing
  useEffect(() => {
    if (query.length < 2) {
      setSugerencias([]);
      setAbierto(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      setAbierto(true);
      try {
        const res = await apiFetch(
          `/pacientes/?search=${encodeURIComponent(query)}&page_size=${SEARCH_SUGGESTIONS_LIMIT}`
        );
        if (res.ok) {
          const data: PaginatedResponse<PacienteSugerencia> = await res.json();
          setSugerencias(data.results ?? []);
        }
      } catch {
        // Fail silently — close dropdown on network error
        setAbierto(false);
      } finally {
        setBuscando(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleSelectSugerencia = (paciente: PacienteSugerencia) => {
    router.push(buildPacienteUrl(paciente.id));
    setAbierto(false);
    setQuery("");
    setSugerencias([]);
  };

  // ── Auth / logout ────────────────────────────────────────────────────────
  const logout = () => {
    clearSession();
    clearUser();
    router.push("/login");
  };

  // ── Mobile hamburger menu state ──────────────────────────────────────────
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on click outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const isAdmin = user?.rol === "admin" || user?.is_superuser;
  const links = isAdmin ? [...NAV_LINKS, ...ADMIN_LINKS] : NAV_LINKS;

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username ?? "";

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 md:px-6 py-2 md:py-3">

        {/* Logo */}
        <Link href="/dashboard" className="font-bold text-green-700 text-sm md:text-base shrink-0 flex-1 min-w-0 truncate">
          {APP_EMOJI} <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>

        {/* Nav links — desktop only */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-green-100 text-green-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Hamburger button — mobile only */}
        <div ref={menuRef} className="md:hidden">
          <button
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {menuAbierto ? (
              /* X icon */
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Dropdown mobile menu */}
          {menuAbierto && (
            <nav
              aria-label="Menú de navegación móvil"
              className="absolute left-0 right-0 top-full z-50 border-b border-slate-200 bg-white shadow-md md:hidden"
            >
              {links.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuAbierto(false)}
                    className={`block px-6 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-green-50 text-green-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Global search — visible when authenticated */}
        {user && (
          <div ref={searchRef} className="relative hidden lg:block">
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar paciente…"
                aria-label="Buscar paciente"
                className="w-48 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {buscando && (
                <span
                  aria-label="Buscando…"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-green-500 border-t-transparent"
                />
              )}
            </div>

            {/* Suggestions dropdown */}
            {abierto && query.length >= 2 && (
              <div
                role="listbox"
                aria-label="Sugerencias de pacientes"
                className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-slate-200 bg-white shadow-lg"
              >
                {sugerencias.length === 0 && !buscando ? (
                  <p className="px-4 py-3 text-sm text-slate-500">
                    Sin resultados para &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  <ul>
                    {sugerencias.map((p) => (
                      <li key={p.id}>
                        <button
                          role="option"
                          aria-selected={false}
                          onClick={() => handleSelectSugerencia(p)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                        >
                          <span className="font-medium text-slate-800">
                            {p.nombre}
                          </span>
                          {(p.especie_nombre || p.tutor_nombre) && (
                            <span className="ml-1 text-slate-400">
                              {p.especie_nombre && `· ${p.especie_nombre}`}
                              {p.tutor_nombre && ` · ${p.tutor_nombre}`}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Usuario + logout */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {user && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-800 leading-tight">
                {displayName}
              </span>
              <span className={`text-xs font-medium leading-tight ${
                isAdmin ? "text-green-600" : "text-slate-400"
              }`}>
                {isAdmin ? "Admin" : "Vet"}
              </span>
            </div>
          )}

          <button onClick={logout} className="btn-secondary text-xs md:text-sm px-2 md:px-4 py-2 md:py-2">
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
