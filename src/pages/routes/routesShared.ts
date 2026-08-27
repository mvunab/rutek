import type { Order, RouteStatus } from '../../types';
import type { OrderFormData } from '../../components/orders/OrderForm';
import { formatAddressLabel } from '../../lib/orderAddress';
import { isUuid } from '../../lib/uuid';
import { clsx } from 'clsx';

const routeDayFormatter = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' });

export const LAYOUT_KEY = 'rutek-routes-layout';
export type RouteLayout = 'cards' | 'table';

export type SortDir = 'asc' | 'desc' | null;
export type RouteSortKey =
  | 'code'
  | 'name'
  | 'status'
  | 'pedidos'
  | 'bultos'
  | 'fecha'
  | 'createdAt'
  | 'driverName'
  | 'vehiclePlate';

export const ROUTE_STATUSES: RouteStatus[] = ['not_started', 'in_progress', 'completed', 'cancelled'];

export const routeStatusDot: Record<RouteStatus, string> = {
  not_started: 'bg-stone-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

export interface RouteFormData {
  guiaInterna: string;
  name: string;
  notes: string;
  clientId: string;
}

export type RouteAgg = {
  pedidos: number;
  bultos: number;
  delivered: number;
  rejected: number;
  vehiclesLabel: string;
  driversLabel: string;
};

export function formatRouteDay(isoLike: string | undefined): string {
  if (!isoLike?.trim()) return '—';
  try {
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return '—';
    return routeDayFormatter.format(d);
  } catch {
    return '—';
  }
}

/** Fecha estilo tarjeta del modal de ruta (ej. 20 - 05 - 2026). */
export function formatRouteDayElegant(isoLike: string | undefined): string {
  if (!isoLike?.trim()) return '—';
  try {
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd} - ${mm} - ${d.getFullYear()}`;
  } catch {
    return '—';
  }
}

export function orderAddressParts(addr: Order['origin'] | Order['destination']) {
  return {
    location: formatAddressLabel(addr),
    street: addr.street?.trim() || null,
  };
}

export const CHILE_REGION_OPTIONS: { value: string; label: string }[] = [
  { value: 'Arica y Parinacota', label: 'Arica y Parinacota' },
  { value: 'Tarapacá', label: 'Tarapacá' },
  { value: 'Antofagasta', label: 'Antofagasta' },
  { value: 'Atacama', label: 'Atacama' },
  { value: 'Coquimbo', label: 'Coquimbo' },
  { value: 'Valparaíso', label: 'Valparaíso' },
  { value: 'Metropolitana', label: 'Región Metropolitana' },
  { value: "O'Higgins", label: "O'Higgins" },
  { value: 'Maule', label: 'Maule' },
  { value: 'Ñuble', label: 'Ñuble' },
  { value: 'Biobío', label: 'Biobío' },
  { value: 'Araucanía', label: 'La Araucanía' },
  { value: 'Los Ríos', label: 'Los Ríos' },
  { value: 'Los Lagos', label: 'Los Lagos' },
  { value: 'Aysén', label: 'Aysén' },
  { value: 'Magallanes', label: 'Magallanes' },
];

export function getRegionSelectOptions(currentRegion?: string) {
  const current = currentRegion?.trim() || '';
  const empty = { value: '', label: 'Sin cambio…' };
  if (!current) return [empty, ...CHILE_REGION_OPTIONS];
  if (CHILE_REGION_OPTIONS.some((o) => o.value === current)) return [empty, ...CHILE_REGION_OPTIONS];
  return [empty, { value: current, label: current }, ...CHILE_REGION_OPTIONS];
}

export const containerCard = clsx(
  'rounded-xl border shadow-sm',
  'bg-white border-stone-200 text-stone-900 shadow-stone-200/50',
  'dark:bg-[#161616] dark:border-stone-800/80 dark:text-stone-100 dark:shadow-md dark:shadow-black/15',
);

export function summarizeRouteVehicles(
  routeOrders: Order[],
  legacyRoutePlate?: string,
): string {
  const plates = [
    ...new Set(
      routeOrders
        .map((o) => o.vehiclePlate?.trim())
        .filter((p): p is string => Boolean(p)),
    ),
  ];
  if (plates.length === 1) return plates[0]!;
  if (plates.length > 1) return `${plates.length} patentes`;
  return legacyRoutePlate?.trim() ?? '';
}

/** Choferes y peonetas viven en el pedido (RM-1), no en la ruta. */
export function summarizeRouteAssignees(
  routeOrders: Order[],
  field: 'driverName' | 'peonetaName',
): string {
  const names = [
    ...new Set(
      routeOrders
        .map((o) => o[field]?.trim())
        .filter((n): n is string => Boolean(n)),
    ),
  ];
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return names.join(' · ');
  return `${names[0]} +${names.length - 1}`;
}

export function orderToFormData(order: Order): OrderFormData {
  return {
    clientId: order.clientId,
    destinatario: order.clientName ?? '',
    priority: order.priority,
    originStreet: order.origin.street,
    originCity: order.origin.city,
    originRegion: order.origin.region || 'Metropolitana',
    destStreet: order.destination.street,
    destCity: order.destination.city,
    destRegion: order.destination.region || 'Metropolitana',
    estimatedDelivery: order.estimatedDelivery,
    notes: order.notes ?? '',
    bultos: order.bultos,
  };
}

/** Pedido sin chofer, peoneta ni vehículo asignados. */
export function isOrderUnassigned(o: Order): boolean {
  return !(
    (o.driverId && isUuid(o.driverId)) ||
    Boolean(o.driverName?.trim()) ||
    (o.peonetaId && isUuid(o.peonetaId)) ||
    Boolean(o.peonetaName?.trim()) ||
    (o.vehicleId && isUuid(o.vehicleId)) ||
    Boolean(o.vehiclePlate?.trim())
  );
}
