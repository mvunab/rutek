import type { LatLngExpression } from 'leaflet';

export type StatusFilter =
  | 'all'
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'rejected'
  | 'terminal'
  | 'open';

export const SANTIAGO_CENTER: LatLngExpression = [-33.4489, -70.6693];

export function statusColor(status: string): string {
  if (status === 'delivered') return '#059669';
  if (status === 'rejected') return '#dc2626';
  if (status === 'in_transit') return '#2563eb';
  if (status === 'pending') return '#d97706';
  return '#78716c';
}

export const SIMILARITY_THRESHOLD = 0.8;
