import type { RouteStatus } from '../types';

/** Tokens alineados con `OrderStatusBadge` / `RouteStatusBadge` (variantes UI). */
export type StatusColorTokens = {
  /** Gráficos Recharts e indicadores inline */
  fill: string;
  bar: string;
  dot: string;
};

/** Pedidos — misma semántica que `variantForOrderSlug` en Badge.tsx */
export const ORDER_STATUS_COLORS: Record<string, StatusColorTokens> = {
  pending: { fill: '#f59e0b', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  in_transit: { fill: '#8b5cf6', bar: 'bg-violet-500', dot: 'bg-violet-500' },
  delivered: { fill: '#10b981', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  rejected: { fill: '#ef4444', bar: 'bg-red-500', dot: 'bg-red-500' },
  confirmed: { fill: '#3b82f6', bar: 'bg-blue-500', dot: 'bg-blue-500' },
  cancelled: { fill: '#a8a29e', bar: 'bg-stone-400', dot: 'bg-stone-400' },
  returned: { fill: '#78716c', bar: 'bg-stone-500', dot: 'bg-stone-500' },
};

const ORDER_DEFAULT: StatusColorTokens = {
  fill: '#a8a29e',
  bar: 'bg-stone-400',
  dot: 'bg-stone-400',
};

/** Rutas — misma semántica que `RouteStatusBadge` */
export const ROUTE_STATUS_COLORS: Record<RouteStatus, StatusColorTokens> = {
  not_started: { fill: '#3b82f6', bar: 'bg-blue-500', dot: 'bg-blue-500' },
  in_progress: { fill: '#f59e0b', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  completed: { fill: '#10b981', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  cancelled: { fill: '#ef4444', bar: 'bg-red-500', dot: 'bg-red-500' },
};

export function orderStatusColors(slug: string): StatusColorTokens {
  return ORDER_STATUS_COLORS[slug] ?? ORDER_DEFAULT;
}

export function routeStatusColors(status: RouteStatus): StatusColorTokens {
  return ROUTE_STATUS_COLORS[status];
}

/** Serie semanal del dashboard (no es estado, fijo). */
export const DASHBOARD_SERIES_COLORS = {
  created: '#3b82f6',
  delivered: '#10b981',
} as const;
