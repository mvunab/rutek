import type { VehicleType } from '../types';

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  cargo_truck: 'Camión de carga',
  truck: 'Camión',
  van: 'Furgón',
  motorcycle: 'Motocicleta',
};

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const capacityFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });

export function formatVehicleDate(iso?: string | null): string {
  if (!iso?.trim()) return '—';
  const day = iso.trim().slice(0, 10);
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return '—';
  return dateFormatter.format(new Date(y, m - 1, d));
}

export function formatVehicleCapacity(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return capacityFormatter.format(value);
}
