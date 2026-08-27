import { clsx } from 'clsx';
import { severityLabel } from '../../lib/observability';
import type { ApiObservabilityDashboard } from '../../types/observability';
import { StatusDot } from './ObservabilityShared';

export function ObservabilityModulesTable({ data }: { data: ApiObservabilityDashboard }) {
  return (
    <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Performance por módulo</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          {data.summary.moduleCount} módulos · {data.summary.criticalModules} críticos
        </p>
      </div>
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500 bg-stone-50 dark:bg-stone-900/80">
              <th className="px-3 py-2">Módulo</th>
              <th className="px-3 py-2 text-right tabular-nums">Req.</th>
              <th className="px-3 py-2 text-right tabular-nums">Avg</th>
              <th className="px-3 py-2 text-right tabular-nums">p95</th>
              <th className="px-3 py-2 text-right tabular-nums">Max</th>
              <th className="px-3 py-2 text-right tabular-nums">Err%</th>
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {data.modules.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-stone-500 text-sm">
                  Sin tráfico registrado aún. Navega la app para generar métricas.
                </td>
              </tr>
            ) : (
              data.modules.map((m) => (
                <tr
                  key={m.module}
                  className={clsx(
                    m.isBottleneck && 'bg-amber-50/50 dark:bg-amber-950/10',
                  )}
                >
                  <td className="px-3 py-2 font-medium text-stone-800 dark:text-stone-100">
                    {m.label}
                    {m.isBottleneck ? (
                      <span className="ml-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                        bottleneck
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-stone-600 dark:text-stone-300">{m.requestCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{m.avgMs} ms</td>
                  <td
                    className={clsx(
                      'px-3 py-2 text-right tabular-nums font-medium',
                      m.p95Ms >= 1500 && 'text-red-600 dark:text-red-400',
                      m.p95Ms >= 700 && m.p95Ms < 1500 && 'text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {m.p95Ms} ms
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-stone-500">{m.maxMs} ms</td>
                  <td className="px-3 py-2 text-right tabular-nums">{m.errorRate}%</td>
                  <td className="px-3 py-2">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 text-xs font-medium',
                        m.severity === 'critical' && 'text-red-600 dark:text-red-400',
                        m.severity === 'warning' && 'text-amber-600 dark:text-amber-400',
                        m.severity === 'ok' && 'text-emerald-600 dark:text-emerald-400',
                      )}
                    >
                      <StatusDot
                        tone={
                          m.severity === 'critical'
                            ? 'critical'
                            : m.severity === 'warning'
                              ? 'warning'
                              : 'ok'
                        }
                      />
                      {severityLabel(m.severity)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
