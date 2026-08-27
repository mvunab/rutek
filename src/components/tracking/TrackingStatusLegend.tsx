import { TrackingOrderStatusMarker } from './TrackingOrderStatusMarker';
import { buildStatusCounts } from './trackingOrderStatusUtils';

interface TrackingStatusLegendProps {
  orders: Array<{ status: string }>;
}

export function TrackingStatusLegend({ orders }: TrackingStatusLegendProps) {
  const counts = buildStatusCounts(orders);
  if (counts.length === 0) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
      <p className="text-xs font-bold text-stone-600 mb-2">Estados de los pedidos</p>
      <ul className="flex flex-wrap gap-2" aria-label="Resumen por estado">
        {counts.map(({ status, count }) => (
          <li key={status} className="inline-flex items-center gap-1.5">
            <TrackingOrderStatusMarker status={status} />
            <span className="text-xs font-bold text-stone-500 tabular-nums">×{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
