import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { Vehicle } from '../../types';
import { formatComplianceHint, type VehicleComplianceSummary } from '../../lib/vehicleCompliance';

export function VehiclesFleetAlertsBanner({
  fleetAlertCount,
  alertsExpanded,
  vehiclesWithAlerts,
  onToggle,
}: {
  fleetAlertCount: number;
  alertsExpanded: boolean;
  vehiclesWithAlerts: { vehicle: Vehicle; compliance: VehicleComplianceSummary }[];
  onToggle: () => void;
}) {
  if (fleetAlertCount <= 0) return null;

  return (
    <div
      className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 overflow-hidden"
      role="region"
      aria-label="Alertas de vencimiento de flota"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
        aria-expanded={alertsExpanded}
      >
        <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <p className="flex-1 text-sm text-amber-900 dark:text-amber-100">
          <strong className="font-semibold tabular-nums">{fleetAlertCount}</strong>{' '}
          {fleetAlertCount === 1 ? 'vehículo tiene' : 'vehículos tienen'} mantención o documentación por vencer o vencida.
        </p>
        <span className="text-xs text-amber-700 dark:text-amber-300 shrink-0">
          {alertsExpanded ? 'Ocultar' : 'Ver detalle'}
        </span>
        {alertsExpanded
          ? <ChevronUp size={14} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          : <ChevronDown size={14} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        }
      </button>

      {alertsExpanded && (
        <div className="border-t border-amber-200 dark:border-amber-900 divide-y divide-amber-100 dark:divide-amber-900/60">
          {vehiclesWithAlerts.map(({ vehicle, compliance }) => (
            <div key={vehicle.id} className="px-4 py-3 flex flex-wrap items-start gap-x-4 gap-y-1">
              <div className="min-w-0">
                <Link
                  to={`/vehiculos/${vehicle.id}`}
                  className="text-sm font-semibold text-stone-900 dark:text-stone-100 hover:text-primary-700 dark:hover:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                  translate="no"
                >
                  {vehicle.plate}
                </Link>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                  {vehicle.brand} {vehicle.model} {vehicle.year}
                </p>
              </div>
              <ul className="flex flex-wrap gap-2 mt-0.5" aria-label={`Alertas de ${vehicle.plate}`}>
                {compliance.items.map((item) => (
                  <li
                    key={item.kind}
                    className={clsx(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                      item.status === 'expired'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
                    )}
                  >
                    <AlertTriangle size={10} aria-hidden />
                    {formatComplianceHint(item)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
