import type { RouteStatus } from '../../types';

export type RouteListItem = {
  code: string;
  routeId: string;
  routeName: string;
  routeStatus: RouteStatus;
  driverName: string;
  fecha: string;
  photoCount: number;
  orderCount: number;
};

export function isRouteDelivered(status: RouteStatus) {
  return status === 'completed';
}

export const panelHeader =
  'px-3 py-2 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider shrink-0';

export const listItemBase =
  'w-full text-left px-3 py-2.5 border-b border-stone-100 dark:border-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset';

export const routeStatusDot: Record<RouteStatus, string> = {
  not_started: 'bg-stone-400',
  in_progress: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-400',
};
