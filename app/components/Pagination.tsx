"use client";

export type PaginationProps = {
  count: number;
  next: string | null;
  previous: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
};

/**
 * Pure visibility logic — exported so it can be tested independently.
 * Returns which navigation controls should be visible.
 */
export function getPaginationVisibility(
  next: string | null,
  previous: string | null
): { showNext: boolean; showPrevious: boolean } {
  return {
    showNext: next !== null,
    showPrevious: previous !== null,
  };
}

/**
 * Presentational pagination component.
 * Renders "Anterior" / "Siguiente" buttons only when there are more pages.
 */
export default function Pagination({
  count,
  next,
  previous,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const { showNext, showPrevious } = getPaginationVisibility(next, previous);

  if (!showNext && !showPrevious) return null;

  return (
    <nav
      className="flex items-center justify-between mt-6"
      aria-label="Paginación"
    >
      <div className="flex items-center gap-2">
        {showPrevious && (
          <button
            onClick={() => onPageChange(currentPage - 1)}
            className="btn-secondary"
            aria-label="Página anterior"
          >
            ← Anterior
          </button>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Página {currentPage} · {count} registros en total
      </p>

      <div className="flex items-center gap-2">
        {showNext && (
          <button
            onClick={() => onPageChange(currentPage + 1)}
            className="btn-secondary"
            aria-label="Página siguiente"
          >
            Siguiente →
          </button>
        )}
      </div>
    </nav>
  );
}
