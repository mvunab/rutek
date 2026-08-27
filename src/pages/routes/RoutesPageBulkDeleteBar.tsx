import { Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { RoutesPageState } from './useRoutesPage';

export function RoutesPageBulkDeleteBar(s: RoutesPageState) {
  const {
    bulkDeleteSelectedIds,
    filteredRoutes,
    selectAllBulkDelete,
    selectNoneBulkDelete,
    bulkDeleteBusy,
    setBulkDeleteOpen,
  } = s;

  return (
          <div
            className="mx-6 rounded-xl border border-red-200/80 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/25 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0"
            role="region"
            aria-label="Eliminación en lote"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                Selección para eliminar
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400 tabular-nums">
                {bulkDeleteSelectedIds.size} de {filteredRoutes.length} ruta
                {filteredRoutes.length === 1 ? '' : 's'} seleccionada
                {bulkDeleteSelectedIds.size === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={selectAllBulkDelete} disabled={bulkDeleteBusy}>
                Todas
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={selectNoneBulkDelete} disabled={bulkDeleteBusy}>
                Ninguna
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                disabled={bulkDeleteSelectedIds.size === 0 || bulkDeleteBusy}
                onClick={() => setBulkDeleteOpen(true)}
              >
                Eliminar {bulkDeleteSelectedIds.size > 0 ? `(${bulkDeleteSelectedIds.size})` : ''}
              </Button>
            </div>
          </div>
  );
}
