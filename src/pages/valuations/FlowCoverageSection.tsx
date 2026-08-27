import { Users } from 'lucide-react';
import { clsx } from 'clsx';

export function FlowCoverageSection({
  withFlow,
  activeClientsCount,
  coveragePct,
}: {
  withFlow: number;
  activeClientsCount: number;
  coveragePct: number;
}) {
  return (
    <section
      className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 px-4 py-3"
      aria-labelledby="flow-coverage-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-stone-500" aria-hidden />
          <h2 id="flow-coverage-heading" className="text-xs font-semibold text-stone-800 dark:text-stone-100">
            Cobertura de flujos
          </h2>
        </div>
        <span className="text-xs text-stone-600 dark:text-stone-400 tabular-nums">
          {withFlow}/{activeClientsCount} clientes · {coveragePct}%
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={coveragePct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Porcentaje de clientes con flujo de cobro"
      >
        <div
          className={clsx(
            'h-full rounded-full transition-[width] duration-300',
            coveragePct >= 80 ? 'bg-emerald-500' : coveragePct >= 40 ? 'bg-primary-500' : 'bg-amber-500',
          )}
          style={{ width: `${coveragePct}%` }}
        />
      </div>
    </section>
  );
}
