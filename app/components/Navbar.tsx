"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tutores", label: "Tutores" },
  { href: "/pacientes", label: "Pacientes" },
  { href: "/citas", label: "Citas" },
  { href: "/fichas", label: "Fichas" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    sessionStorage.removeItem("access");
    sessionStorage.removeItem("refresh");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    router.push("/login");
    };

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-bold text-green-700">
          Veterinaria Scarlet
        </Link>

        <nav className="flex items-center gap-2">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-green-100 text-green-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <button
            onClick={logout}
            className="ml-3 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}