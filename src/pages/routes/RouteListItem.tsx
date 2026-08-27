import {
  Route as RouteIcon,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CheckSquare,
  Square,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Route } from '../../types';
import { RouteStatusBadge } from '../../components/ui/Badge';
import { formatRouteDisplayLabel } from '../../lib/routeSequence';

export function RouteListItem({
  route,
  agg,
  fecha,
  selected,
  onSelect,
  bulkMode,
  bulkChecked,
  onBulkToggle,
}: {
  route: Route;
  agg: Pick<import('./routesShared').RouteAgg, 'pedidos' | 'bultos' | 'delivered' | 'rejected' | 'vehiclesLabel'>;
  fecha: string;
  selected: boolean;
  onSelect: () => void;
  bulkMode?: boolean;
  bulkChecked?: boolean;
  onBulkToggle?: () => void;
}) {
  const terminalDone = agg.delivered + agg.rejected;
  const deliveryPct =
    agg.pedidos > 0 ? Math.round((terminalDone / agg.pedidos) * 100) : 0;
  const hasDeliveries = agg.delivered > 0;
  const hasRejections = agg.rejected > 0;
  const completedWithWarning = route.status === 'completed' && hasRejections;

  const handleClick = () => {
    if (bulkMode && onBulkToggle) onBulkToggle();
    else onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={bulkMode ? bulkChecked : selected}
      className={clsx(
        'w-full text-left rounded-xl px-4 py-3.5 transition-colors glass shadow-sm',
        'hover:bg-white/90 dark:hover:bg-stone-900/90 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950',
        bulkMode && bulkChecked
          ? 'border-primary-400/80 dark:border-primary-500/70 ring-2 ring-primary-400/20 dark:ring-primary-500/25 shadow-md'
          : !bulkMode && selected
            ? 'border-primary-400/80 dark:border-primary-500/70 ring-2 ring-primary-400/20 dark:ring-primary-500/25 shadow-md'
            : completedWithWarning
              ? 'border-red-300/90 dark:border-red-800/70'
              : 'border-stone-200/80 dark:border-stone-700/70',
      )}
    >
      <div className="flex items-start gap-3">
        {bulkMode ? (
          <span
            className="shrink-0 mt-2 text-primary-600 dark:text-primary-400"
            aria-hidden
          >
            {bulkChecked ? <CheckSquare size={20} /> : <Square size={20} className="text-stone-400" />}
          </span>
        ) : null}
        <div
          className={clsx(
            'size-11 shrink-0 rounded-xl flex items-center justify-center',
            !bulkMode && selected ? 'bg-primary-50/90 dark:bg-primary-950/40' : 'bg-stone-100/70 dark:bg-stone-800/60',
          )}
          aria-hidden
        >
          <RouteIcon
            size={20}
            className={!bulkMode && selected ? 'text-primary-600 dark:text-primary-400' : 'text-stone-500 dark:text-stone-400'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">
            <span translate="no" className="tabular-nums">N° {formatRouteDisplayLabel(route)}</span>
            {route.name?.trim() ? (
              <span className="font-normal text-stone-500 dark:text-stone-400"> · {route.name}</span>
            ) : null}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
            <RouteStatusBadge status={route.status} />
            {hasRejections ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                <AlertTriangle size={11} aria-hidden />
                {agg.rejected} rechazo{agg.rejected !== 1 ? 's' : ''}
                {route.status === 'completed' ? ' · revisar' : ''}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
            <span>{fecha}</span>
            <span>{agg.pedidos} pedidos</span>
            <span>{agg.bultos} bultos</span>
            {hasDeliveries ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={12} aria-hidden />
                {agg.delivered}/{agg.pedidos} entregados
              </span>
            ) : null}
            {agg.vehiclesLabel ? (
              <span translate="no" className="font-mono">
                {agg.vehiclesLabel}
              </span>
            ) : null}
          </div>
          {agg.pedidos > 0 ? (
            <div
              className="mt-2 h-1 rounded-full bg-stone-200/90 dark:bg-stone-800 overflow-hidden"
              role="progressbar"
              aria-valuenow={deliveryPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${terminalDone} de ${agg.pedidos} pedidos resueltos`}
            >
              <div
                className={clsx(
                  'h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none',
                  hasRejections ? 'bg-red-500' : 'bg-emerald-500',
                )}
                style={{ width: `${deliveryPct}%` }}
              />
            </div>
          ) : null}
        </div>
        {!bulkMode ? (
          <ChevronDown
            size={18}
            className={clsx(
              'shrink-0 text-stone-300 dark:text-stone-600 transition-transform duration-200',
              selected && 'rotate-180 text-primary-600 dark:text-primary-400',
            )}
            aria-hidden
          />
        ) : null}
      </div>
    </button>
  );
}
