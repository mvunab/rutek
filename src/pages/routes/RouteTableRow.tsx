import type { KeyboardEvent } from 'react';
import { AlertTriangle, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import { clsx } from 'clsx';
import type { Route } from '../../types';
import { RouteStatusBadge } from '../../components/ui/Badge';
import { formatRouteSequence } from '../../lib/routeSequence';
import type { RouteAgg } from './routesShared';

export function RouteTableRow({
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
  agg: RouteAgg;
  fecha: string;
  selected: boolean;
  onSelect: () => void;
  bulkMode?: boolean;
  bulkChecked?: boolean;
  onBulkToggle?: () => void;
}) {
  const handleClick = () => {
    if (bulkMode && onBulkToggle) onBulkToggle();
    else onSelect();
  };

  const isHighlighted = bulkMode ? bulkChecked : selected;

  const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <tr
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={clsx(
        'cursor-pointer transition-colors border-b border-stone-100 dark:border-stone-800',
        isHighlighted
          ? 'bg-primary-50/80 dark:bg-primary-950/25 shadow-[inset_3px_0_0_0] shadow-primary-500 dark:shadow-primary-400'
          : 'hover:bg-stone-50 dark:hover:bg-stone-800/50',
      )}
    >
      {bulkMode ? (
        <td className="px-3 py-2.5 align-middle w-10">
          <span className="text-primary-600 dark:text-primary-400" aria-hidden>
            {bulkChecked ? <CheckSquare size={18} /> : <Square size={18} className="text-stone-400" />}
          </span>
        </td>
      ) : null}
      <td className="px-4 py-2.5 align-middle">
        <span
          translate="no"
          className={clsx(
            'font-mono text-xs font-semibold tabular-nums block truncate',
            isHighlighted ? 'text-primary-700 dark:text-primary-300' : 'text-stone-600 dark:text-stone-400',
          )}
        >
          {formatRouteSequence(route)}
        </span>
      </td>
      <td className="px-4 py-2.5 align-middle min-w-0">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{route.name}</p>
      </td>
      <td className="px-4 py-2.5 align-middle whitespace-nowrap">
        <div className="flex flex-col gap-1 items-start">
          <RouteStatusBadge status={route.status} />
          {agg.rejected > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
              <AlertTriangle size={10} aria-hidden />
              {agg.rejected} rechazo{agg.rejected !== 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs text-stone-500 dark:text-stone-400 tabular-nums">
        {fecha}
      </td>
      <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs tabular-nums text-right">
        <span className="text-stone-600 dark:text-stone-300">{agg.pedidos}</span>
        {agg.delivered > 0 ? (
          <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={11} aria-hidden />
            {agg.delivered} entreg.
          </span>
        ) : null}
      </td>
      <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs text-stone-600 dark:text-stone-300 tabular-nums text-right">
        {agg.bultos}
      </td>
      <td className="px-4 py-2.5 align-middle min-w-0">
        <span translate="no" className="text-xs text-stone-500 dark:text-stone-400 font-mono truncate block">
          {agg.vehiclesLabel || '—'}
        </span>
      </td>
      <td className="px-4 py-2.5 align-middle min-w-0">
        <span className="text-xs text-stone-500 dark:text-stone-400 truncate block">
          {agg.driversLabel || '—'}
        </span>
      </td>
    </tr>
  );
}
