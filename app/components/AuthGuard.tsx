"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";

function SessionLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Verificando sesión...</p>
      </div>
    </div>
  );
}

function clearSession() {
  sessionStorage.removeItem("access");
  sessionStorage.removeItem("refresh");
  sessionStorage.removeItem("user_me");
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

async function tryRefreshToken(): Promise<string | null> {
  const refresh = sessionStorage.getItem("refresh");
  if (!refresh) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/refresh/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    sessionStorage.setItem("access", data.access);
    return data.access;
  } catch {
    return null;
  }
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Rutas que no requieren autenticación
  const PUBLIC_PATHS = ["/login", "/registro"];
  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    const validarToken = async () => {
      setChecking(true);

      let token = sessionStorage.getItem("access");

      // Sin token → intentar refresh antes de redirigir
      if (!token) {
        token = await tryRefreshToken();
      }

      if (!token) {
        setAuthorized(false);
        setChecking(false);
        if (!isPublicPage) router.replace("/login");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pacientes/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 401) {
          // Access expirado → intentar refresh
          const newToken = await tryRefreshToken();

          if (!newToken) {
            clearSession();
            setAuthorized(false);
            if (!isPublicPage) router.replace("/login");
            return;
          }

          // Revalidar con nuevo token
          const retry = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/pacientes/`,
            { headers: { Authorization: `Bearer ${newToken}` } }
          );

          if (!retry.ok) {
            clearSession();
            setAuthorized(false);
            if (!isPublicPage) router.replace("/login");
            return;
          }
        } else if (!res.ok) {
          clearSession();
          setAuthorized(false);
          if (!isPublicPage) router.replace("/login");
          return;
        }

        setAuthorized(true);
        // Usuario ya autenticado intenta entrar a login o registro → al dashboard
        if (isPublicPage) router.replace("/dashboard");
      } catch {
        clearSession();
        setAuthorized(false);
        if (!isPublicPage) router.replace("/login");
      } finally {
        setChecking(false);
      }
    };

    validarToken();
  }, [pathname, router, isPublicPage]);

  if (checking) return <SessionLoader />;

  if (!authorized && !isPublicPage) return null;

  return (
    <>
      {!isPublicPage && authorized && <Navbar />}
      {children}
    </>
  );
}
