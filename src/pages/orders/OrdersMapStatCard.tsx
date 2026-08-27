import { clsx } from 'clsx';

export function OrdersMapStatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'neutral' | 'amber' | 'blue' | 'green' | 'red';
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border px-3 py-2.5 flex items-center gap-2.5 min-w-0',
        tone === 'neutral' && 'bg-surface dark:bg-stone-900 border-stone-200 dark:border-stone-800',
        tone === 'amber' && 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40',
        tone === 'blue' && 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40',
        tone === 'green' && 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40',
        tone === 'red' && 'bg-red-50/80 dark:bg-red-950/30 border-red-100 dark:border-red-900/40',
      )}
    >
      <span className="shrink-0 text-stone-500 dark:text-stone-400" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-stone-900 dark:text-stone-100 leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}
