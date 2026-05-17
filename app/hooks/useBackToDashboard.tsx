"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Hook que redirige siempre al dashboard cuando se presiona flecha atrás
 * Se aplica globalmente en el layout para funcionar en toda la app
 */
export default function useBackToDashboard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // No aplicar en dashboard (no tiene sentido hacer back a dashboard si ya estás ahí)
    if (pathname === "/dashboard") {
      return;
    }

    const handlePopState = () => {
      console.log("Back presionado - redirigiendo a dashboard");
      router.push("/dashboard");
    };

    // Agregar un estado al historial para capturar el back
    window.history.pushState(null, "", window.location.href);

    // Escuchar cuando el usuario presione back
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, router]);
}
