import { clsx } from 'clsx';
import { resolveStatusLabel } from '../../lib/trackingReport';
import { orderStatusColors } from '../../lib/statusColors';
import { normalizeTrackingStatus } from './trackingOrderStatusUtils';

const MARKER_RING: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  in_transit: 'bg-violet-50 text-violet-800 ring-violet-200',
  delivered: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-red-50 text-red-800 ring-red-200',
  confirmed: 'bg-blue-50 text-blue-800 ring-blue-200',
  cancelled: 'bg-stone-100 text-stone-600 ring-stone-200',
  returned: 'bg-stone-100 text-stone-700 ring-stone-200',
};

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
  const slug = normalizeTrackingStatus(status);
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
