import { Link } from 'react-router-dom';
import { Pencil, X, Truck } from 'lucide-react';
import { clsx } from 'clsx';
import type { Vehicle } from '../../types';
import type { VehicleComplianceSummary } from '../../lib/vehicleCompliance';
import { EmptyState } from '../../components/ui/EmptyState';
import type { SortDir, SortKey } from './vehicleForm';
import { VehicleComplianceBadges, VehiclesSortCol } from './VehiclesTableUi';

export function VehiclesTable({
  loading,
  loaded,
  paginated,
  sortCol,
  sortDir,
  onSort,
  complianceByVehicleId,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  loaded: boolean;
  paginated: Vehicle[];
  sortCol: SortKey;
  sortDir: SortDir;
  onSort: (col: SortKey) => void;
  complianceByVehicleId: Map<string, VehicleComplianceSummary>;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px]">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/90">
              <th
                scope="col"
                className="px-3 py-3 w-20 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide"
              >
                <span className="sr-only">Acciones</span>
              </th>
              <VehiclesSortCol colKey="plate" label="Patente" className="w-28" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <VehiclesSortCol colKey="brand" label="Marca" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <VehiclesSortCol colKey="model" label="Modelo" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <VehiclesSortCol colKey="year" label="Año" className="w-24 tabular-nums" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <th scope="col" className="p-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide min-w-[120px]">
                VIN
              </th>
              <th scope="col" className="p-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide min-w-[180px]">
                Vencimientos
              </th>
              <VehiclesSortCol colKey="available" label="Estado" className="w-28" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {loading && !loaded ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-stone-500">
                  <span role="status" aria-live="polite">
                    Cargando vehículos…
                  </span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6">
                  <EmptyState
                    icon={<Truck className="size-10 text-stone-300 dark:text-stone-600" aria-hidden />}
                    title="Sin vehículos"
                    description="Agrega el primero con el botón Agregar o ajusta los filtros."
                  />
                </td>
              </tr>
            ) : (
              paginated.map((v, i) => (
                <tr
                  key={v.id}
                  className={clsx(
                    'border-b border-stone-100 dark:border-stone-800 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-colors',
                    i % 2 === 0 ? 'bg-white dark:bg-stone-900' : 'bg-stone-50/50 dark:bg-stone-900/80',
                  )}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(v)}
                        className="size-7 flex items-center justify-center rounded border border-stone-200 dark:border-stone-600 text-stone-500 hover:text-primary-600 hover:border-primary-300 dark:hover:border-primary-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        aria-label={`Editar vehículo ${v.plate}`}
                        title="Editar"
                      >
                        <Pencil size={13} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(v)}
                        className="size-7 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-950/60 dark:hover:bg-red-900/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        aria-label={`Eliminar vehículo ${v.plate}`}
                        title="Eliminar"
                      >
                        <X size={13} strokeWidth={2.5} aria-hidden />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      to={`/vehiculos/${v.id}`}
                      className="font-mono text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                      translate="no"
                    >
                      {v.plate}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-stone-700 dark:text-stone-200">{v.brand}</td>
                  <td className="px-3 py-2.5 text-sm text-stone-700 dark:text-stone-200 min-w-0 max-w-[220px] truncate" title={v.model}>
                    {v.model}
                  </td>
                  <td className="px-3 py-2.5 text-sm tabular-nums text-stone-700 dark:text-stone-200">{v.year}</td>
                  <td className="px-3 py-2.5">
                    <span translate="no" className="font-mono text-xs text-stone-600 dark:text-stone-300">
                      {v.vin?.trim() || '–'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <VehicleComplianceBadges summary={complianceByVehicleId.get(v.id)!} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={clsx(
                        'inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border',
                        v.available
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700',
                      )}
                    >
                      {v.available ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
