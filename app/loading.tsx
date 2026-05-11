/**
 * Loading UI global de Next.js App Router.
 * Se muestra automáticamente durante la navegación entre páginas.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Cargando...</p>
      </div>
    </div>
  );
}
