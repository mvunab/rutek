import { Calendar, Hash } from 'lucide-react';
import type { Vehicle } from '../../types';
import { formatVehicleCapacity, formatVehicleDate, VEHICLE_TYPE_LABELS } from '../../lib/vehicleLabels';
import { InfoRow } from './VehicleDetailUi';

export function VehicleDetailInfoPanels({
  vehicle,
  routeCount,
  orderCount,
}: {
  vehicle: Vehicle;
  routeCount: number;
  orderCount: number;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Identificación</h2>
        </div>
        <dl className="px-5">
          <InfoRow label="VIN">
            <span translate="no" className="font-mono text-sm break-all">
              {vehicle.vin?.trim() || '—'}
            </span>
          </InfoRow>
          <InfoRow label="Tipo">{VEHICLE_TYPE_LABELS[vehicle.type]}</InfoRow>
          <InfoRow label="Capacidad">
            <span className="tabular-nums">{formatVehicleCapacity(vehicle.capacity)}</span>
          </InfoRow>
          <InfoRow label="Año">
            <span className="tabular-nums">{vehicle.year}</span>
          </InfoRow>
          <InfoRow label="Alta en sistema">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Calendar size={14} className="text-stone-400 shrink-0" aria-hidden />
              {formatVehicleDate(vehicle.createdAt)}
            </span>
          </InfoRow>
        </dl>
      </section>

      <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
          <Hash size={16} className="text-stone-400" aria-hidden />
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Resumen operativo</h2>
        </div>
        <div className="p-5 space-y-3 text-sm text-stone-700 dark:text-stone-300">
          <p>
            Este vehículo aparece en{' '}
            <strong className="text-stone-900 dark:text-stone-100 tabular-nums">{routeCount}</strong>{' '}
            {routeCount === 1 ? 'ruta' : 'rutas'} y en{' '}
            <strong className="text-stone-900 dark:text-stone-100 tabular-nums">{orderCount}</strong>{' '}
            {orderCount === 1 ? 'pedido' : 'pedidos'}.
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Los contadores incluyen asignaciones a nivel de ruta y de pedido individual.
          </p>
        </div>
      </section>
    </div>
  );
}
