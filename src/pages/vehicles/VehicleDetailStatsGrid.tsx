import { AlertTriangle, Gauge, MapPin, Package } from 'lucide-react';
import type { Vehicle } from '../../types';
import { formatVehicleCapacity } from '../../lib/vehicleLabels';
import { StatCard } from './VehicleDetailUi';

export function VehicleDetailStatsGrid({
  routeCount,
  orderCount,
  vehicle,
  alertCount,
}: {
  routeCount: number;
  orderCount: number;
  vehicle: Vehicle;
  alertCount: number;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Rutas asignadas"
        value={routeCount}
        accent="bg-primary-500"
        icon={<MapPin size={16} className="text-primary-600 dark:text-primary-400" aria-hidden />}
      />
      <StatCard
        label="Pedidos con este vehículo"
        value={orderCount}
        accent="bg-amber-500"
        icon={<Package size={16} className="text-amber-700 dark:text-amber-400" aria-hidden />}
      />
      <StatCard
        label="Capacidad"
        value={formatVehicleCapacity(vehicle.capacity)}
        accent="bg-violet-500"
        icon={<Gauge size={16} className="text-violet-600 dark:text-violet-400" aria-hidden />}
      />
      <StatCard
        label="Alertas documentación"
        value={alertCount}
        accent={alertCount > 0 ? 'bg-red-500' : 'bg-stone-300 dark:bg-stone-600'}
        icon={
          <AlertTriangle
            size={16}
            className={alertCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-500'}
            aria-hidden
          />
        }
      />
    </div>
  );
}
