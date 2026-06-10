import { formatAddressFull, formatAddressLabel } from './orderAddress';
import { resolveOrderStatusLabel } from './orderStatusLabels';
import { routeStatusLabel, normalizeRouteStatus } from './routeStatusLabels';
import type { Order, OrderPriority, Route, Tenant } from '../types';

export const ROUTES_EXPORT_HEADERS = [
  'Código ruta',
  'Nombre ruta',
  'Estado ruta',
  'Fecha ruta',
  'Cuenta mandante',
  'Código pedido',
  'Estado pedido',
  'Destinatario',
  'Prioridad',
  'Bultos',
  'Origen',
  'Destino',
  'Dirección destino',
  'Entrega estimada',
  'Chofer',
  'Peoneta',
  'Vehículo',
] as const;

const PRIORITY_LABELS: Record<OrderPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

function routeDateIso(route: Route): string {
  const raw =
    typeof route.startTime === 'string' && route.startTime.includes('T')
      ? route.startTime
      : route.createdAt;
  if (!raw?.trim()) return '';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function resolveMandanteName(
  route: Route,
  order: Order | null,
  clientNames?: Map<string, string>,
): string {
  const clientId = route.clientId ?? order?.clientId;
  if (clientId && clientNames?.get(clientId)) return clientNames.get(clientId)!;
  return '';
}

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function orderRow(
  route: Route,
  order: Order | null,
  options?: { clientNames?: Map<string, string>; tenant?: Tenant | null },
): string[] {
  const status = normalizeRouteStatus(route.status);
  const mandante = resolveMandanteName(route, order, options?.clientNames);

  if (!order) {
    return [
      route.code,
      route.name,
      routeStatusLabel(status),
      routeDateIso(route),
      mandante,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ];
  }

  return [
    route.code,
    route.name,
    routeStatusLabel(status),
    routeDateIso(route),
    mandante || options?.clientNames?.get(order.clientId) || '',
    order.code,
    resolveOrderStatusLabel(order.status, options?.tenant),
    order.clientName?.trim() || '',
    PRIORITY_LABELS[order.priority] ?? order.priority,
    String(Number(order.bultos) || 0),
    formatAddressFull(order.origin),
    formatAddressLabel(order.destination),
    order.destination.street?.trim() || '',
    order.estimatedDelivery?.trim() || '',
    order.driverName?.trim() || '',
    order.peonetaName?.trim() || '',
    order.vehiclePlate?.trim() || '',
  ];
}

/** Una fila por pedido; rutas sin pedidos generan una fila con datos de ruta solamente. */
export function buildRoutesExportRows(
  routes: Route[],
  orders: Order[],
  options?: { clientNames?: Map<string, string>; tenant?: Tenant | null },
): string[][] {
  const ordersByRoute = new Map<string, Order[]>();
  for (const order of orders) {
    if (!order.routeId) continue;
    const list = ordersByRoute.get(order.routeId) ?? [];
    list.push(order);
    ordersByRoute.set(order.routeId, list);
  }

  const rows: string[][] = [];
  for (const route of routes) {
    const routeOrders = (ordersByRoute.get(route.id) ?? []).toSorted((a, b) =>
      a.code.localeCompare(b.code, 'es'),
    );
    if (routeOrders.length === 0) {
      rows.push(orderRow(route, null, options));
      continue;
    }
    for (const order of routeOrders) {
      rows.push(orderRow(route, order, options));
    }
  }
  return rows;
}

export function downloadRoutesExportCsv(
  routes: Route[],
  orders: Order[],
  options?: { clientNames?: Map<string, string>; tenant?: Tenant | null },
): { rowCount: number; routeCount: number } {
  const dataRows = buildRoutesExportRows(routes, orders, options);
  if (dataRows.length === 0) return { rowCount: 0, routeCount: 0 };

  const lines = [
    ROUTES_EXPORT_HEADERS.join(';'),
    ...dataRows.map((row) => row.map(csvCell).join(';')),
  ];
  const csv = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `rutek-rutas-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);

  return { rowCount: dataRows.length, routeCount: routes.length };
}
