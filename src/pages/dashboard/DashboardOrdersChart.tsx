import { lazy, Suspense } from 'react';
import { DASHBOARD_SERIES_COLORS } from '../../lib/statusColors';

type ChartPoint = { label: string; value: number; value2?: number };

const DashboardOrdersChartInner = lazy(() =>
  import('./DashboardOrdersChartInner').then((m) => ({ default: m.DashboardOrdersChartInner })),
);

function ChartLoadingPlaceholder({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-stone-400 dark:text-stone-500"
      style={{ height }}
      role="status"
      aria-live="polite"
    >
      Cargando gráfico…
    </div>
  );
}

export function DashboardOrdersChart({
  data,
  hasOrdersChart,
  ordersChartWeekEmpty,
  ordersCount,
}: {
  data: ChartPoint[];
  hasOrdersChart: boolean;
  ordersChartWeekEmpty: boolean;
  ordersCount: number;
}) {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Pedidos de la semana</h3>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Creados vs entregados</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded inline-block"
              style={{ backgroundColor: DASHBOARD_SERIES_COLORS.created }}
              aria-hidden
            />
            Creados
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded inline-block"
              style={{ backgroundColor: DASHBOARD_SERIES_COLORS.delivered }}
              aria-hidden
            />
            Entregados
          </span>
        </div>
      </div>
      {hasOrdersChart ? (
        <Suspense fallback={<ChartLoadingPlaceholder height={200} />}>
          <DashboardOrdersChartInner
            data={data}
            ordersChartWeekEmpty={ordersChartWeekEmpty}
            ordersCount={ordersCount}
          />
        </Suspense>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-sm text-stone-400 dark:text-stone-500">
          Sin pedidos en el sistema
        </div>
      )}
    </div>
  );
}
