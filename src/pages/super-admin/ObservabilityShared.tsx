import { clsx } from 'clsx';

export function StatusDot({ tone }: { tone: 'ok' | 'warning' | 'critical' | 'neutral' }) {
  return (
    <span
      className={clsx(
        'inline-block size-2 rounded-full shrink-0',
        tone === 'ok' && 'bg-emerald-500',
        tone === 'warning' && 'bg-amber-500',
        tone === 'critical' && 'bg-red-500',
        tone === 'neutral' && 'bg-stone-400',
      )}
      aria-hidden
    />
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: 'ok' | 'warning' | 'critical' | 'neutral';
}) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-stone-400 dark:text-stone-500" aria-hidden>{icon}</span>
        <StatusDot tone={tone} />
      </div>
      <p className="text-xl font-bold tabular-nums text-stone-900 dark:text-stone-50">{value}</p>
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">{label}</p>
      {hint ? <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">{hint}</p> : null}
    </div>
  );
}
