import { clsx } from 'clsx';
import { formatCLP } from '../../lib/pricingProfile';

export function ValuationSummaryCard({
  label,
  amount,
  icon,
  tone,
  hint,
}: {
  label: string;
  amount: number;
  icon: React.ReactNode;
  tone: 'client' | 'worker' | 'margin' | 'negative';
  hint?: string;
}) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl border px-4 py-3 flex items-start gap-3',
        tone === 'client' && 'bg-primary-50/80 dark:bg-primary-950/25 border-primary-100 dark:border-primary-900/50',
        tone === 'worker' && 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-700',
        tone === 'margin' && 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-100 dark:border-emerald-900/50',
        tone === 'negative' && 'bg-red-50/70 dark:bg-red-950/25 border-red-100 dark:border-red-900/50',
      )}
    >
      <div
        className={clsx(
          'absolute inset-y-0 left-0 w-1',
          tone === 'client' && 'bg-primary-500',
          tone === 'worker' && 'bg-stone-400',
          tone === 'margin' && 'bg-emerald-500',
          tone === 'negative' && 'bg-red-500',
        )}
        aria-hidden
      />
      <span
        className={clsx(
          'size-9 rounded-lg flex items-center justify-center shrink-0 ml-1',
          tone === 'client' && 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300',
          tone === 'worker' && 'bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
          tone === 'margin' && 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
          tone === 'negative' && 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{label}</p>
        <p className="text-lg font-bold tabular-nums text-stone-900 dark:text-stone-50">
          {formatCLP(amount)}
        </p>
        {hint ? (
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
