import { AlertTriangle, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { OrderStatusBadge } from '../../components/ui/Badge';
import type { Order } from '../../types';

export function OrderListItem({
  order,
  selected,
  onSelect,
}: {
  order: Order;
  selected: boolean;
  onSelect: (o: Order) => void;
}) {
  const hasPin = Boolean(order.destination.coordinates);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(order)}
        className={clsx(
          'w-full text-left px-3 py-2.5 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors duration-200',
          selected && 'bg-primary-50/80 dark:bg-primary-950/30',
          !hasPin && 'border-l-2 border-amber-400',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-100">
            {order.code}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 truncate">
          {order.clientName}
        </p>
        <p className="text-[11px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
          {hasPin ? (
            <MapPin size={11} className="shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <AlertTriangle size={11} className="shrink-0 text-amber-500" aria-hidden />
          )}
          {hasPin
            ? `${order.destination.city || order.destination.street || 'Con pin'}`
            : `Sin pin · ingresar dirección`}
        </p>
      </button>
    </li>
  );
}
