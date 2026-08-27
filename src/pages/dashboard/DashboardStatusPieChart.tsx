import { lazy, Suspense } from 'react';

type StatusPoint = { label: string; value: number; key?: string; fill?: string };

const DashboardStatusPieChartInner = lazy(() =>
  import('./DashboardStatusPieChartInner').then((m) => ({ default: m.DashboardStatusPieChartInner })),
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

export function DashboardStatusPieChart({
  data,
  hasStatusChart,
}: {
  data: StatusPoint[];
  hasStatusChart: boolean;
}) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-1">Estado de pedidos</h3>
      <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">Distribución actual</p>
      {hasStatusChart ? (
        <Suspense fallback={<ChartLoadingPlaceholder height={140} />}>
          <DashboardStatusPieChartInner data={data} />
        </Suspense>
      ) : (
        <div className="h-[140px] flex items-center justify-center text-sm text-stone-400 dark:text-stone-500">
          Sin pedidos en el sistema
        </div>
      )}
    </div>
  );
}
