import * as XLSX from 'xlsx';
import { formatAddressFull, formatAddressLabel } from './orderAddress';
import { resolveOrderStatusLabel } from './orderStatusLabels';
import { resolveRouteSequence } from './routeSequence';
import { routeStatusLabel, normalizeRouteStatus } from './routeStatusLabels';
import type { Order, OrderPriority, Route, RouteStatus, Tenant } from '../types';

export type RoutesDateRangeFilter = '7d' | '30d' | 'month' | '90d' | 'all';

const PERIOD_LABELS: Record<RoutesDateRangeFilter, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  month: 'Mes en curso',
  '90d': 'Últimos 90 días',
  all: 'Todo el historial',
};

const dateFmt = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' });

/** Fecha mínima (inclusive) según el filtro de período en Rutas. */
export function routesExportCutoff(filter: RoutesDateRangeFilter): Date | null {
  if (filter === 'all') return null;
  if (filter === 'month') {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const days = Number.parseInt(filter, 10);
  return new Date(Date.now() - days * 86_400_000);
}

export interface RoutesExportRangeDescription {
  periodLabel: string;
  fromLabel: string | null;
  toLabel: string;
  /** Texto corto para toolbar / tooltip */
  short: string;
  /** Texto completo para filtros y toast */
  summary: string;
  filenameSuffix: string;
}

export function describeRoutesExportRange(
  filter: RoutesDateRangeFilter,
  now = new Date(),
): RoutesExportRangeDescription {
  const toLabel = dateFmt.format(now);
  const periodLabel = PERIOD_LABELS[filter];

  if (filter === 'all') {
    return {
      periodLabel,
      fromLabel: null,
      toLabel,
      short: 'Todas las fechas',
      summary:
        'Se exportan las rutas que coinciden con los filtros actuales, sin límite de fecha (todo el historial).',
      filenameSuffix: 'historial-completo',
    };
  }

  const cutoff = routesExportCutoff(filter)!;
  const fromLabel = dateFmt.format(cutoff);

  return {
    periodLabel,
    fromLabel,
    toLabel,
    short: `${fromLabel} → hoy`,
    summary: `Se exportan rutas cuya fecha de planificación es desde el ${fromLabel} hasta hoy (${toLabel}). Período activo: ${periodLabel}.`,
    filenameSuffix: filter === 'month' ? 'mes-en-curso' : filter,
  };
}

export function describeRoutesExportFilters(options: {
  dateRange: RoutesDateRangeFilter;
  routeStatus: RouteStatus | 'all';
  clientLabel: string | null;
  search: string;
}): string {
  const parts: string[] = [describeRoutesExportRange(options.dateRange).summary];
  if (options.routeStatus !== 'all') {
    parts.push(`Estado de ruta: ${routeStatusLabel(options.routeStatus)}.`);
  }
  if (options.clientLabel) {
    parts.push(`Cuenta mandante: ${options.clientLabel}.`);
  }
  if (options.search.trim()) {
    parts.push(`Búsqueda: «${options.search.trim()}».`);
  }
  return parts.join(' ');
}

export const ROUTES_EXPORT_HEADERS = [
  'N° ruta',
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

function formatRouteSequence(route: Route): string {
  const n = resolveRouteSequence(route);
  return n != null ? String(n) : '';
}

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

function orderRow(
  route: Route,
  order: Order | null,
  options?: { clientNames?: Map<string, string>; tenant?: Tenant | null },
): string[] {
  const status = normalizeRouteStatus(route.status);
  const mandante = resolveMandanteName(route, order, options?.clientNames);

  if (!order) {
    return [
      formatRouteSequence(route),
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
    formatRouteSequence(route),
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

export function downloadRoutesExportXlsx(
  routes: Route[],
  orders: Order[],
  options?: {
    clientNames?: Map<string, string>;
    tenant?: Tenant | null;
    dateRange?: RoutesDateRangeFilter;
  },
): { rowCount: number; routeCount: number; filename: string } {
  const dataRows = buildRoutesExportRows(routes, orders, options);
  if (dataRows.length === 0) return { rowCount: 0, routeCount: 0, filename: '' };

  const range = describeRoutesExportRange(options?.dateRange ?? '30d');
  const todayIso = new Date().toISOString().slice(0, 10);
  const filename = `rutek-rutas-${range.filenameSuffix}-${todayIso}.xlsx`;

  const sheet = XLSX.utils.aoa_to_sheet([Array.from(ROUTES_EXPORT_HEADERS), ...dataRows]);
  sheet['!cols'] = ROUTES_EXPORT_HEADERS.map((header) => ({
    wch: Math.min(Math.max(header.length + 2, 10), 40),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Rutas');
  XLSX.writeFile(workbook, filename);

  return { rowCount: dataRows.length, routeCount: routes.length, filename };
}

/** @deprecated Usar {@link downloadRoutesExportXlsx}. */
export function downloadRoutesExportCsv(
  routes: Route[],
  orders: Order[],
  options?: {
    clientNames?: Map<string, string>;
    tenant?: Tenant | null;
    dateRange?: RoutesDateRangeFilter;
  },
): { rowCount: number; routeCount: number; filename: string } {
  return downloadRoutesExportXlsx(routes, orders, options);
}
