import { resolveOrderStatusLabel } from './orderStatusLabels';
import { normalizeRouteStatus, routeStatusLabel } from './routeStatusLabels';
import type { StatusBreakdownRow } from '../components/dashboard/EntityStatusBreakdown';
import type { DashboardStats, Order, Route, RouteStatus, Tenant } from '../types';

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function computeAvgDeliveryDays(orders: Order[]): number {
  const days: number[] = [];
  for (const o of orders) {
    if (!o.actualDelivery?.trim()) continue;
    const start = new Date(o.createdAt).getTime();
    const end = new Date(o.actualDelivery).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) continue;
    days.push((end - start) / (1000 * 60 * 60 * 24));
  }
  if (days.length === 0) return 0;
  const avg = days.reduce((a, b) => a + b, 0) / days.length;
  return Math.round(avg * 10) / 10;
}

/** KPIs calculados desde pedidos, rutas y clientes cargados en el cliente. */
export function computeDashboardKpis(
  orders: Order[],
  routes: Route[],
  totalClients: number,
): DashboardStats {
  const totalOrders = orders.length;
  const ordersThisMonth = orders.filter((o) => isThisMonth(o.createdAt)).length;
  const ordersInTransit = orders.filter((o) => o.status === 'in_transit').length;
  const ordersDelivered = orders.filter((o) => o.status === 'delivered').length;
  const ordersPending = orders.filter((o) => o.status === 'pending').length;
  const ordersRejected = orders.filter((o) => o.status === 'rejected').length;

  const finished = ordersDelivered + ordersRejected;
  const deliveryRate =
    finished > 0
      ? Math.round((ordersDelivered / finished) * 100)
      : totalOrders > 0
        ? Math.round((ordersDelivered / totalOrders) * 100)
        : 0;

  const activeRoutes = routes.filter((r) => {
    const s = normalizeRouteStatus(r.status);
    return s === 'not_started' || s === 'in_progress';
  }).length;

  return {
    totalOrders: ordersThisMonth > 0 ? ordersThisMonth : totalOrders,
    ordersInTransit,
    ordersDelivered,
    ordersPending,
    activeRoutes,
    totalClients,
    deliveryRate,
    avgDeliveryTime: computeAvgDeliveryDays(orders),
  };
}

/** Usa API solo si trae datos; si no, los KPI locales. */
export function mergeDashboardStats(
  api: DashboardStats,
  local: DashboardStats,
): DashboardStats {
  const apiHasData =
    api.totalOrders > 0 ||
    api.ordersInTransit > 0 ||
    api.ordersDelivered > 0 ||
    api.activeRoutes > 0;
  return apiHasData ? { ...local, ...api } : local;
}

export function kpiOrdersTotalSubtitle(orders: Order[]): string {
  const month = orders.filter((o) => isThisMonth(o.createdAt)).length;
  const total = orders.length;
  if (month > 0 && month < total) return `${month} este mes · ${total} en total`;
  if (month > 0) return 'Creados este mes';
  return total > 0 ? 'Registrados en el sistema' : 'Sin pedidos aún';
}

const ROUTE_STATUS_ORDER: RouteStatus[] = [
  'not_started',
  'in_progress',
  'completed',
  'cancelled',
];

const ROUTE_BAR: Record<RouteStatus, { bar: string; dot: string }> = {
  not_started: { bar: 'bg-blue-500', dot: 'bg-blue-500' },
  in_progress: { bar: 'bg-amber-500', dot: 'bg-amber-500' },
  completed: { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  cancelled: { bar: 'bg-red-500', dot: 'bg-red-500' },
};

const BUILTIN_ORDER_STATUS_ORDER = [
  'pending',
  'in_transit',
  'delivered',
  'rejected',
  'confirmed',
  'cancelled',
  'returned',
] as const;

const ORDER_BAR: Record<string, { bar: string; dot: string }> = {
  pending: { bar: 'bg-amber-500', dot: 'bg-amber-500' },
  in_transit: { bar: 'bg-violet-500', dot: 'bg-violet-500' },
  delivered: { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  rejected: { bar: 'bg-red-500', dot: 'bg-red-500' },
  confirmed: { bar: 'bg-blue-500', dot: 'bg-blue-500' },
  cancelled: { bar: 'bg-stone-400', dot: 'bg-stone-400' },
  returned: { bar: 'bg-stone-500', dot: 'bg-stone-500' },
};

const ORDER_BAR_DEFAULT = { bar: 'bg-stone-400', dot: 'bg-stone-400' };

function orderBarClasses(slug: string) {
  return ORDER_BAR[slug] ?? ORDER_BAR_DEFAULT;
}

export function buildRouteStatusBreakdown(routes: Route[]): StatusBreakdownRow[] {
  const counts: Record<RouteStatus, number> = {
    not_started: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  for (const route of routes) {
    const key = normalizeRouteStatus(route.status);
    counts[key] += 1;
  }

  return ROUTE_STATUS_ORDER.map((key) => {
    const colors = ROUTE_BAR[key];
    return {
      key,
      label: routeStatusLabel(key),
      count: counts[key],
      barClass: colors.bar,
      dotClass: colors.dot,
    };
  });
}

export function buildOrderStatusBreakdown(
  orders: Order[],
  tenant?: Tenant | null,
): StatusBreakdownRow[] {
  const counts = new Map<string, number>();
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
  }

  const keys = [...counts.keys()].sort((a, b) => {
    const ai = BUILTIN_ORDER_STATUS_ORDER.indexOf(a as (typeof BUILTIN_ORDER_STATUS_ORDER)[number]);
    const bi = BUILTIN_ORDER_STATUS_ORDER.indexOf(b as (typeof BUILTIN_ORDER_STATUS_ORDER)[number]);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
  });

  return keys.map((key) => {
    const colors = orderBarClasses(key);
    return {
      key,
      label: resolveOrderStatusLabel(key, tenant),
      count: counts.get(key) ?? 0,
      barClass: colors.bar,
      dotClass: colors.dot,
    };
  });
}

/** Datos para gráfico de torta cuando el API no devuelve `statusChart`. */
export function orderStatusToChartPoints(
  orders: Order[],
  tenant?: Tenant | null,
): { label: string; value: number }[] {
  return buildOrderStatusBreakdown(orders, tenant).map((row) => ({
    label: row.label,
    value: row.count,
  }));
}
