import type { ApiObservabilityDashboard } from '../../types/observability';

export function ObservabilitySlowEndpointsTable({ data }: { data: ApiObservabilityDashboard }) {
  return (
    <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Endpoints más lentos</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Por módulo y método HTTP</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500 bg-stone-50 dark:bg-stone-900/80">
              <th className="px-3 py-2">Endpoint</th>
              <th className="px-3 py-2 text-right tabular-nums">Req.</th>
              <th className="px-3 py-2 text-right tabular-nums">p95</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {data.slowEndpoints.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-stone-500 text-sm">
                  Sin datos suficientes
                </td>
              </tr>
            ) : (
              data.slowEndpoints.map((row) => (
                <tr key={`${row.method}-${row.module}`}>
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs text-violet-700 dark:text-violet-300">{row.method}</span>
                    <span className="text-stone-700 dark:text-stone-200 ml-2">{row.label}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.requestCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-amber-700 dark:text-amber-300">
                    {row.p95Ms} ms
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
