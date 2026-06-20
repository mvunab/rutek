import { clsx } from 'clsx';
import { resolveStatusLabel } from '../../lib/trackingReport';
import { orderStatusColors } from '../../lib/statusColors';

const MARKER_RING: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  in_transit: 'bg-violet-50 text-violet-800 ring-violet-200',
  delivered: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-red-50 text-red-800 ring-red-200',
  confirmed: 'bg-blue-50 text-blue-800 ring-blue-200',
  cancelled: 'bg-stone-100 text-stone-600 ring-stone-200',
  returned: 'bg-stone-100 text-stone-700 ring-stone-200',
};

const MARKER_ACCENT: Record<string, string> = {
  pending: 'border-l-amber-500',
  in_transit: 'border-l-violet-500',
  delivered: 'border-l-emerald-500',
  rejected: 'border-l-red-500',
  confirmed: 'border-l-blue-500',
  cancelled: 'border-l-stone-400',
  returned: 'border-l-stone-500',
};

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

interface TrackingOrderStatusMarkerProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function TrackingOrderStatusMarker({
  status,
  size = 'sm',
  className,
}: TrackingOrderStatusMarkerProps) {
  const slug = normalizeStatus(status);
  const label = resolveStatusLabel(slug);
  const dotClass = orderStatusColors(slug).dot;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        MARKER_RING[slug] ?? 'bg-stone-100 text-stone-700 ring-stone-200',
        className,
      )}
    >
      <span
        className={clsx('rounded-full shrink-0', dotClass, size === 'sm' ? 'size-2' : 'size-2.5')}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function trackingOrderAccentClass(status: string): string {
  const slug = normalizeStatus(status);
  return MARKER_ACCENT[slug] ?? 'border-l-stone-300';
}

/** Resumen de conteos por estado para la vista de ruta. */
export function buildStatusCounts(
  orders: Array<{ status: string }>,
): Array<{ status: string; count: number }> {
  const map = new Map<string, number>();
  for (const order of orders) {
    const slug = normalizeStatus(order.status);
    map.set(slug, (map.get(slug) ?? 0) + 1);
  }
  const priority = ['in_transit', 'pending', 'confirmed', 'delivered', 'rejected', 'cancelled', 'returned'];
  const entries = [...map.entries()].map(([status, count]) => ({ status, count }));
  entries.sort((a, b) => {
    const ai = priority.indexOf(a.status);
    const bi = priority.indexOf(b.status);
    if (ai === -1 && bi === -1) return a.status.localeCompare(b.status, 'es');
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return entries;
}
