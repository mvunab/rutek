import type { RouteStatus } from '../types';

/** Estados actuales + legado `planned` / `active`. */

export function normalizeRouteStatus(raw: string): RouteStatus {
  if (raw === 'planned') return 'not_started';
  if (raw === 'active') return 'in_progress';
  if (
    raw === 'not_started' ||
    raw === 'in_progress' ||
    raw === 'completed' ||
    raw === 'cancelled'
  ) {
    return raw;
  }
  return 'not_started';
}

const LABELS: Record<RouteStatus, string> = {
  not_started: 'No comenzado',
  in_progress: 'Incompleto',
  completed: 'Entregado',
  cancelled: 'Cancelada',
};

export function routeStatusLabel(status: RouteStatus): string {
  return LABELS[status] ?? status;
}
