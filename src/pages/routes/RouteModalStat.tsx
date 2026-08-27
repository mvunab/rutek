import type { ReactNode } from 'react';
import type { RouteStatus } from '../../types';
import { routeStatusLabel } from '../../lib/routeStatusLabels';
import { clsx } from 'clsx';

export function RouteModalStat({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-stone-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="text-xs font-semibold text-stone-800 dark:text-stone-100 tabular-nums leading-snug">
        {children}
      </div>
    </div>
  );
}

const routePriorityChipStyles: Record<RouteStatus, string> = {
  not_started:
    'border-stone-300 text-stone-600 bg-stone-100 dark:border-stone-600 dark:text-stone-400 dark:bg-stone-800/50',
  in_progress:
    'border-amber-300 text-amber-800 bg-amber-50 dark:border-amber-500/50 dark:text-amber-400 dark:bg-amber-950/30',
  completed:
    'border-emerald-300 text-emerald-800 bg-emerald-50 dark:border-emerald-500/50 dark:text-emerald-400 dark:bg-emerald-950/30',
  cancelled:
    'border-red-300 text-red-800 bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:bg-red-950/30',
};

export function RoutePriorityChip({ status }: { status: RouteStatus }) {
  return (
    <span
      className={clsx(
        'shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide',
        routePriorityChipStyles[status],
      )}
    >
      {routeStatusLabel(status)}
    </span>
  );
}
