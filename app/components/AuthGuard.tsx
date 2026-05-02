"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const isLoginPage = pathname === "/login";

  const clearSession = () => {
    sessionStorage.removeItem("access");
    sessionStorage.removeItem("refresh");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  };

  useEffect(() => {
    const validarToken = async () => {
      setChecking(true);

      const token = sessionStorage.getItem("access");

      if (!token) {
        setAuthorized(false);
        setChecking(false);

        if (!isLoginPage) {
          router.replace("/login");
        }

        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pacientes/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          clearSession();
          setAuthorized(false);

          if (!isLoginPage) {
            router.replace("/login");
          }

          return;
        }

        setAuthorized(true);

        if (isLoginPage) {
          router.replace("/dashboard");
        }
      } catch {
        clearSession();
        setAuthorized(false);

        if (!isLoginPage) {
          router.replace("/login");
        }
      } finally {
        setChecking(false);
      }
    };

    validarToken();
  }, [pathname, router, isLoginPage]);

  if (checking) {
    return <main className="p-8">Validando sesión...</main>;
  }

  if (!authorized && !isLoginPage) {
    return null;
  }

  return (
    <>
      {!isLoginPage && authorized && <Navbar />}
      {children}
    </>
  );
}