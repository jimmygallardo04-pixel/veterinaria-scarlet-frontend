"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  /** Ruta fija a la que volver. Si no se pasa, usa router.back() */
  href?: string;
  label?: string;
}

/**
 * Botón de volver consistente en todas las vistas.
 *
 * Uso:
 *   <BackButton />                    → usa historial del browser
 *   <BackButton href="/pacientes" />  → ruta fija (más predecible)
 *   <BackButton label="Volver a fichas" href="/fichas" />
 */
export default function BackButton({
  href,
  label = "Volver",
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button onClick={handleClick} className="btn-back">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}
