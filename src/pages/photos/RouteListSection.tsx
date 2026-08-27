import { Truck } from 'lucide-react';
import { clsx } from 'clsx';
import { routeStatusLabel } from '../../lib/routeStatusLabels';
import { listItemBase, routeStatusDot, type RouteListItem } from './photosPageShared';

export function RouteListSection({
  title,
  routes,
  selectedRoute,
  onSelectRoute,
}: {
  title: string;
  routes: RouteListItem[];
  selectedRoute: string | null;
  onSelectRoute: (code: string) => void;
}) {
  if (routes.length === 0) return null;

  return (
    <div role="group" aria-label={title}>
      <p className="sticky top-0 z-10 px-3 py-1.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider bg-stone-100/95 dark:bg-stone-900/95 border-b border-stone-200 dark:border-stone-800 backdrop-blur-sm">
        {title}
        <span className="ml-1.5 font-normal tabular-nums text-stone-400 dark:text-stone-500">({routes.length})</span>
      </p>
      {routes.map((route) => {
        const active = selectedRoute === route.code;
        return (
          <button
            key={route.code}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onSelectRoute(route.code)}
            className={clsx(
              listItemBase,
              active
                ? 'bg-primary-50 dark:bg-primary-950/40 border-l-2 border-l-primary-500'
                : 'hover:bg-stone-50 dark:hover:bg-stone-800/60',
            )}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className={clsx('size-1.5 rounded-full shrink-0', routeStatusDot[route.routeStatus])}
                aria-hidden
              />
              <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
                {routeStatusLabel(route.routeStatus)}
              </span>
            </div>
            <span className="font-mono text-sm font-bold text-stone-800 dark:text-stone-100 block">{route.code}</span>
            {route.routeName && (
              <span className="text-[11px] text-stone-600 dark:text-stone-300 truncate block">{route.routeName}</span>
            )}
            {route.driverName && (
              <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5 truncate">
                <Truck size={10} aria-hidden className="shrink-0" />
                {route.driverName}
              </span>
            )}
            <span className="text-[10px] text-stone-400 dark:text-stone-500 tabular-nums mt-1 block">
              {route.orderCount} pedido{route.orderCount !== 1 ? 's' : ''} · {route.photoCount} foto
              {route.photoCount !== 1 ? 's' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
