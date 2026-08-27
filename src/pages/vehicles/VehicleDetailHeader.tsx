import { AlertTriangle, ArrowLeft, Pencil, Trash2, Truck } from 'lucide-react';
import { clsx } from 'clsx';
import type { Vehicle } from '../../types';
import { VEHICLE_TYPE_LABELS } from '../../lib/vehicleLabels';
import { Button } from '../../components/ui/Button';

export function VehicleDetailHeader({
  vehicle,
  alertCount,
  onBack,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  alertCount: number;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          icon={<ArrowLeft size={16} aria-hidden />}
        >
          Volver a vehículos
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onEdit}
            icon={<Pencil size={16} aria-hidden />}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onDelete}
            icon={<Trash2 size={16} aria-hidden />}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="size-14 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center"
              aria-hidden
            >
              <Truck size={28} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-600 dark:text-stone-400 mb-1">
                Patente
              </p>
              <h1
                className="text-3xl font-bold font-mono text-stone-900 dark:text-stone-100 tracking-wide"
                translate="no"
              >
                {vehicle.plate}
              </h1>
              <p className="text-base text-stone-700 dark:text-stone-300 mt-1">
                {vehicle.brand} {vehicle.model}{' '}
                <span className="tabular-nums text-stone-600 dark:text-stone-400">{vehicle.year}</span>
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                {VEHICLE_TYPE_LABELS[vehicle.type]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
                vehicle.available
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                  : 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
              )}
            >
              <span
                className={clsx(
                  'size-2 rounded-full shrink-0',
                  vehicle.available
                    ? 'bg-emerald-500 motion-safe:animate-pulse'
                    : 'bg-stone-400',
                )}
                aria-hidden
              />
              {vehicle.available ? 'Activo' : 'Inactivo'}
            </span>
            {alertCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-950 border border-amber-200 dark:bg-amber-900/50 dark:text-amber-100 dark:border-amber-800">
                <AlertTriangle size={14} aria-hidden />
                {alertCount} {alertCount === 1 ? 'alerta' : 'alertas'}
              </span>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
