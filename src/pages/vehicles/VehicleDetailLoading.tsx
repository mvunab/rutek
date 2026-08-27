export function VehicleDetailLoading() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4" role="status" aria-live="polite">
      <p className="text-sm text-stone-600 dark:text-stone-400">Cargando ficha del vehículo…</p>
      <div className="h-28 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
