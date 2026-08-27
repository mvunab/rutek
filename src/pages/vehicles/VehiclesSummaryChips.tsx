import { Truck } from 'lucide-react';

export function VehiclesSummaryChips({
  total,
  activos,
  inactivos,
}: {
  total: number;
  activos: number;
  inactivos: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300">
        <Truck size={14} className="text-stone-400" aria-hidden />
        Total: <strong className="text-stone-900 dark:text-stone-100 tabular-nums">{total}</strong>
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
        Activos: <strong className="tabular-nums">{activos}</strong>
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
        Inactivos: <strong className="tabular-nums">{inactivos}</strong>
      </span>
    </div>
  );
}
