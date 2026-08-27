export function AuditStatsCards({
  total,
  stats,
}: {
  total: number;
  stats: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
        <p className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">Total</p>
        <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{total}</p>
      </div>
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
        <p className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">Usuarios creados</p>
        <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats['user.create'] ?? 0}</p>
      </div>
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
        <p className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">Actualizaciones</p>
        <p className="text-xl font-semibold text-sky-600 dark:text-sky-400 tabular-nums">{stats['user.update'] ?? 0}</p>
      </div>
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
        <p className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">Eliminaciones</p>
        <p className="text-xl font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
          {(stats['user.delete'] ?? 0) + (stats['tenant.delete'] ?? 0)}
        </p>
      </div>
    </div>
  );
}
