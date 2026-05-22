import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';

export interface StatusBreakdownRow {
  key: string;
  label: string;
  count: number;
  barClass: string;
  dotClass: string;
}

interface EntityStatusBreakdownProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  total: number;
  rows: StatusBreakdownRow[];
  emptyMessage?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
}

export function EntityStatusBreakdown({
  title,
  subtitle,
  icon,
  total,
  rows,
  emptyMessage = 'Sin datos',
  onViewAll,
  viewAllLabel = 'Ver todo',
}: EntityStatusBreakdownProps) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0"
            aria-hidden
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">{title}</h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 tabular-nums shrink-0">
          {total}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-stone-400 dark:text-stone-500 py-6 text-center flex-1">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-3 flex-1" role="list">
          {rows.map((row) => {
            const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
            const barWidth = total > 0 ? Math.max((row.count / max) * 100, row.count > 0 ? 8 : 0) : 0;
            return (
              <li key={row.key}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={clsx('size-2 rounded-full shrink-0', row.dotClass)}
                      aria-hidden
                    />
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-300 truncate">
                      {row.label}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 tabular-nums shrink-0">
                    {row.count}
                    <span className="font-normal text-stone-400 dark:text-stone-500 ml-1">
                      ({pct}%)
                    </span>
                  </span>
                </div>
                <div
                  className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden"
                  role="presentation"
                >
                  <div
                    className={clsx('h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none', row.barClass)}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {onViewAll ? (
        <Button
          variant="ghost"
          size="xs"
          className="mt-4 self-start"
          onClick={onViewAll}
          icon={<ArrowRight size={12} />}
          iconPosition="right"
        >
          {viewAllLabel}
        </Button>
      ) : null}
    </div>
  );
}
