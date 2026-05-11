/**
 * Skeleton genérico para estados de carga de página.
 * Muestra filas de placeholder animadas.
 */
export default function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando...">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton h-7 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-1/3" />
            <div className="skeleton h-4 w-1/2" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-9 w-20 rounded-lg" />
            <div className="skeleton h-9 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
