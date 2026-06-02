import { resolveOrderStatusLabel } from './orderStatusLabels';
import { normalizeRouteStatus, routeStatusLabel } from './routeStatusLabels';
import { orderStatusColors, routeStatusColors } from './statusColors';
import type { StatusBreakdownRow } from '../components/dashboard/EntityStatusBreakdown';
import type { ChartDataPoint, DashboardStats, Order, Route, RouteStatus, Tenant } from '../types';

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

const BUILTIN_ORDER_STATUS_ORDER = [
  'pending',
  'in_transit',
  'delivered',
  'rejected',
  'confirmed',
  'cancelled',
  'returned',
] as const;

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
    const colors = routeStatusColors(key);
    return {
      key,
      label: routeStatusLabel(key),
      count: counts[key],
      barClass: colors.bar,
      dotClass: colors.dot,
      fill: colors.fill,
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
    const colors = orderStatusColors(key);
    return {
      key,
      label: resolveOrderStatusLabel(key, tenant),
      count: counts.get(key) ?? 0,
      barClass: colors.bar,
      dotClass: colors.dot,
      fill: colors.fill,
    };
  });
}

/** Datos para gráfico de torta cuando el API no devuelve `statusChart`. */
export function orderStatusToChartPoints(
  orders: Order[],
  tenant?: Tenant | null,
): ChartDataPoint[] {
  return buildOrderStatusBreakdown(orders, tenant).map((row) => ({
    key: row.key,
    label: row.label,
    value: row.count,
    fill: row.fill,
  }));
}

/** Aplica colores por `key` a puntos del API (p. ej. `/dashboard/stats`). */
export function enrichStatusChartPoints(
  points: ChartDataPoint[],
): ChartDataPoint[] {
  return points.map((p) => ({
    ...p,
    fill: p.fill ?? (p.key ? orderStatusColors(p.key).fill : undefined),
  }));
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

function deliveryDay(order: Order): Date | null {
  if (order.status !== 'delivered') return null;
  const raw = order.actualDelivery?.trim() || order.updatedAt?.trim() || '';
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Serie últimos 7 días (creados vs entregados) cuando `/dashboard/stats` no existe o viene vacío.
 */
export function buildOrdersWeeklyChart(orders: Order[]): ChartDataPoint[] {
  const today = startOfLocalDay(new Date());
  const points: ChartDataPoint[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - offset);

    let created = 0;
    let delivered = 0;

    for (const o of orders) {
      const c = new Date(o.createdAt);
      if (!Number.isNaN(c.getTime()) && isSameLocalDay(c, day)) created += 1;

      const del = deliveryDay(o);
      if (del && isSameLocalDay(del, day)) delivered += 1;
    }

    points.push({
      label: day.toLocaleDateString('es-CL', { weekday: 'short' }),
      value: created,
      value2: delivered,
    });
  }

  return points;
}

export function ordersWeeklyChartHasActivity(points: ChartDataPoint[]): boolean {
  return points.some((p) => (p.value ?? 0) > 0 || (p.value2 ?? 0) > 0);
}

/** Inicio del día local hace `daysAgo` días (0 = hoy). */
export function startOfDaysAgo(daysAgo: number, now = new Date()): Date {
  const d = startOfLocalDay(now);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

/** Pedidos creados en los últimos 7 días calendario (incluye hoy), más recientes primero. */
export function recentOrdersLast7Days(orders: Order[], limit = 12): Order[] {
  const floor = startOfDaysAgo(6);
  return orders
    .filter((o) => {
      const created = new Date(o.createdAt);
      return !Number.isNaN(created.getTime()) && created.getTime() >= floor.getTime();
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
