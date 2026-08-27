import { Eye } from 'lucide-react';
import type { ImportExcelPreviewRow } from './importExcelPreviewTypes';
import type { User, Vehicle } from '../../../types';

export function ImportExcelPreviewOrdersTable({
  previewRows,
  visibleRows,
  showAllRows,
  onToggleShowAllRows,
  drivers,
  vehiclesSorted,
  rowDriverId,
  onRowDriverIdChange,
  rowVehicleId,
  onRowVehicleIdChange,
}: {
  previewRows: ImportExcelPreviewRow[];
  visibleRows: ImportExcelPreviewRow[];
  showAllRows: boolean;
  onToggleShowAllRows: () => void;
  drivers: User[];
  vehiclesSorted: Vehicle[];
  rowDriverId: Record<number, string>;
  onRowDriverIdChange: (updater: (prev: Record<number, string>) => Record<number, string>) => void;
  rowVehicleId: Record<number, string>;
  onRowVehicleIdChange: (updater: (prev: Record<number, string>) => Record<number, string>) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wide">
          {previewRows.length} pedidos a crear
        </p>
        {previewRows.length > 8 && (
          <button
            type="button"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline focus-visible:outline-none"
            onClick={onToggleShowAllRows}
          >
            <Eye size={12} className="inline mr-1" aria-hidden />
            {showAllRows ? 'Mostrar menos' : `Ver todos (${previewRows.length})`}
          </button>
        )}
      </div>
      <div className="rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/70 border-b border-stone-200 dark:border-stone-700">
                {['Destinatario', 'Entrega', 'Chofer', 'Vehículo', 'OC', 'Factura', 'Tipo', 'Cajas', 'Unids'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-stone-600 dark:text-stone-300 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {visibleRows.map((row, i) => (
                <tr key={`${row.client_name}-${row.entrega}-${row.numero_oc}-${row.factura}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  <td className="px-3 py-2 font-medium text-stone-800 dark:text-stone-200 whitespace-nowrap">{row.client_name}</td>
                  <td className="px-3 py-2 text-stone-600 dark:text-stone-400 max-w-[180px] truncate">{row.entrega}</td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Chofer del pedido ${i + 1}`}
                      className="w-44 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-xs text-stone-700 dark:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      value={rowDriverId[i] ?? ''}
                      onChange={(e) =>
                        onRowDriverIdChange((p) => ({ ...p, [i]: e.target.value }))
                      }
                    >
                      <option value="">Sin chofer…</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Vehículo del pedido ${i + 1}`}
                      className="w-52 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-xs text-stone-700 dark:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      value={rowVehicleId[i] ?? ''}
                      onChange={(e) =>
                        onRowVehicleIdChange((p) => ({ ...p, [i]: e.target.value }))
                      }
                    >
                      <option value="">Sin vehículo…</option>
                      {vehiclesSorted.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate} · {v.brand} {v.model}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-stone-500 dark:text-stone-500 whitespace-nowrap font-mono">{row.numero_oc || '—'}</td>
                  <td className="px-3 py-2 text-stone-500 dark:text-stone-500 whitespace-nowrap font-mono">{row.factura || '—'}</td>
                  <td className="px-3 py-2 text-stone-500 dark:text-stone-500">{row.tipo || '—'}</td>
                  <td className="px-3 py-2 text-stone-700 dark:text-stone-300 tabular-nums text-right">{row.cajas}</td>
                  <td className="px-3 py-2 text-stone-700 dark:text-stone-300 tabular-nums text-right">{row.unidades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
