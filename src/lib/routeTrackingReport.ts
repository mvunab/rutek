import type { LucideIcon } from 'lucide-react';
import { ClipboardList, Truck, Package, PackageCheck } from 'lucide-react';

export interface RouteTrackingOrder {
  status: string;
}

export interface RouteProgressStep {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Pedidos que “pertenecen” a esta etapa en el avance actual */
  orderCount: number;
}

export interface RouteProgressSnapshot {
  total: number;
  pending: number;
  confirmed: number;
  inTransit: number;
  delivered: number;
  rejected: number;
  cancelled: number;
  returned: number;
  /** Pedidos en estado terminal (entregado, rechazado, cancelado, devuelto) */
  terminal: number;
  activeIndex: number;
  allCancelled: boolean;
  completionPct: number;
  deliveryPct: number;
  steps: RouteProgressStep[];
  headline: { title: string; subtitle: string };
}

export const ROUTE_WAY_STEPS: Omit<RouteProgressStep, 'orderCount'>[] = [
  { id: 'planned', label: 'Planificada', icon: ClipboardList },
  { id: 'in_route', label: 'En ruta', icon: Truck },
  { id: 'delivering', label: 'Entregas en curso', icon: Package },
  { id: 'completed', label: 'Completada', icon: PackageCheck },
];

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

function countByStatus(orders: RouteTrackingOrder[]) {
  const counts = {
    pending: 0,
    confirmed: 0,
    inTransit: 0,
    delivered: 0,
    rejected: 0,
    cancelled: 0,
    returned: 0,
  };
  for (const order of orders) {
    const s = normalizeStatus(order.status);
    switch (s) {
      case 'pending':
        counts.pending += 1;
        break;
      case 'confirmed':
        counts.confirmed += 1;
        break;
      case 'in_transit':
        counts.inTransit += 1;
        break;
      case 'delivered':
        counts.delivered += 1;
        break;
      case 'rejected':
        counts.rejected += 1;
        break;
      case 'cancelled':
        counts.cancelled += 1;
        break;
      case 'returned':
        counts.returned += 1;
        break;
      default:
        counts.pending += 1;
    }
  }
  return counts;
}

/** Reparte pedidos por etapa visual del way (badges en marcadores). */
function bucketOrdersPerStep(
  orders: RouteTrackingOrder[],
  activeIndex: number,
): number[] {
  const counts = countByStatus(orders);
  const waiting = counts.pending + counts.confirmed;
  const finished =
    counts.delivered + counts.rejected + counts.returned + counts.cancelled;

  if (activeIndex === 3) {
    return [0, 0, 0, finished];
  }
  if (activeIndex === 2) {
    return [0, 0, waiting + counts.inTransit, finished];
  }
  if (activeIndex === 1) {
    return [waiting, counts.inTransit, 0, finished];
  }
  return [waiting, 0, 0, finished];
}

function resolveActiveIndex(
  total: number,
  counts: ReturnType<typeof countByStatus>,
): number {
  if (total === 0) return 0;

  const terminal =
    counts.delivered +
    counts.rejected +
    counts.cancelled +
    counts.returned;

  if (terminal === total) return ROUTE_WAY_STEPS.length - 1;

  const hasDelivered = counts.delivered > 0;
  const hasInTransit = counts.inTransit > 0;
  const hasWaiting = counts.pending + counts.confirmed > 0;

  if (hasDelivered && (hasInTransit || hasWaiting)) {
    return 2;
  }
  if (hasInTransit) return 1;
  if (hasDelivered && !hasInTransit && !hasWaiting) {
    return ROUTE_WAY_STEPS.length - 1;
  }
  return 0;
}

function buildHeadline(
  total: number,
  counts: ReturnType<typeof countByStatus>,
  activeIndex: number,
  allCancelled: boolean,
): { title: string; subtitle: string } {
  if (total === 0) {
    return {
      title: 'Ruta sin pedidos',
      subtitle: 'Aún no hay pedidos asignados a esta ruta.',
    };
  }

  if (allCancelled) {
    return {
      title: 'Ruta cancelada',
      subtitle: 'Todos los pedidos de esta ruta fueron cancelados.',
    };
  }

  const pct = Math.round((counts.delivered / total) * 100);

  switch (activeIndex) {
    case 3:
      return {
        title: 'Ruta completada',
        subtitle: `${counts.delivered} de ${total} pedidos entregados${
          counts.rejected > 0 ? ` · ${counts.rejected} rechazados` : ''
        }.`,
      };
    case 2:
      return {
        title: 'Entregas en curso',
        subtitle: `${counts.delivered} entregados · ${counts.inTransit} en ruta · ${
          counts.pending + counts.confirmed
        } pendientes (${pct}% avance).`,
      };
    case 1:
      return {
        title: 'Ruta en ejecución',
        subtitle: `${counts.inTransit} pedido${counts.inTransit === 1 ? '' : 's'} en ruta hacia destino.`,
      };
    default:
      return {
        title: 'Ruta planificada',
        subtitle: `${counts.pending + counts.confirmed} pedido${
          counts.pending + counts.confirmed === 1 ? '' : 's'
        } en preparación, aún sin salir a terreno.`,
      };
  }
}

export function computeRouteProgress(orders: RouteTrackingOrder[]): RouteProgressSnapshot {
  const total = orders.length;
  const counts = countByStatus(orders);
  const terminal =
    counts.delivered +
    counts.rejected +
    counts.cancelled +
    counts.returned;
  const allCancelled = total > 0 && counts.cancelled === total;
  const activeIndex = allCancelled ? -1 : resolveActiveIndex(total, counts);
  const stepCounts = bucketOrdersPerStep(orders, activeIndex < 0 ? 0 : activeIndex);

  const steps: RouteProgressStep[] = ROUTE_WAY_STEPS.map((step, i) => ({
    ...step,
    orderCount: stepCounts[i] ?? 0,
  }));

  return {
    total,
    ...counts,
    terminal,
    activeIndex,
    allCancelled,
    completionPct: total > 0 ? Math.round((terminal / total) * 100) : 0,
    deliveryPct: total > 0 ? Math.round((counts.delivered / total) * 100) : 0,
    steps,
    headline: buildHeadline(total, counts, activeIndex, allCancelled),
  };
}

/** Etapa del way en la que cae un pedido según su estado y el avance global de la ruta. */
export function orderWayStepIndex(status: string, routeActiveIndex: number): number {
  const s = normalizeStatus(status);
  if (s === 'delivered' || s === 'rejected' || s === 'returned' || s === 'cancelled') {
    return 3;
  }
  if (routeActiveIndex === 2) return 2;
  if (s === 'in_transit') return 1;
  return 0;
}

export const ROUTE_WAY_STEP_LABELS = ROUTE_WAY_STEPS.map((s) => s.label);
