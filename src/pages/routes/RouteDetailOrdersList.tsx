import { Filter, Package, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RouteDetailOrderListItem } from './RouteDetailOrderListItem';
import type { RouteDetailPanelState } from './useRouteDetailSidePanel';

export function RouteDetailOrdersList(s: RouteDetailPanelState) {
  const {
    canManage,
    assigned,
    bulkAssignOpen,
    orderSelectMode,
    actionError,
    filteredAssigned,
    visibleAssigned,
    assignedIndexById,
    trimmedOrderSearch,
    orderStatusFilter,
    setOrderStatusFilter,
    setOrderSearchQuery,
    setVisibleOrderCount,
    ORDERS_PAGE_SIZE,
  } = s;

  return (
    <>
      {canManage && assigned.length > 0 && !bulkAssignOpen && !orderSelectMode ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-stone-500 dark:text-stone-400 px-0.5 -mt-1">
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded border border-[#ff7b00] bg-[#ff7b00]/20" aria-hidden />
            Acción abierta
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded border border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-800" aria-hidden />
            Disponible
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 opacity-50" aria-hidden />
            Bloqueada
          </span>
        </p>
      ) : null}

      {actionError ? (
        <p
          className="text-xs text-red-800 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-3 py-2"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}

      {assigned.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 dark:border-stone-700 dark:bg-stone-900/30 py-8 text-center">
          <Package size={24} className="mx-auto text-stone-400 dark:text-stone-600 mb-1.5" aria-hidden />
          <p className="text-xs text-stone-500">Ningún pedido en esta ruta aún.</p>
        </div>
      ) : filteredAssigned.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-100/80 dark:border-stone-700 dark:bg-stone-900/30 py-8 text-center space-y-2">
          {trimmedOrderSearch ? (
            <Search size={22} className="mx-auto text-stone-400 dark:text-stone-600" aria-hidden />
          ) : (
            <Filter size={22} className="mx-auto text-stone-400 dark:text-stone-600" aria-hidden />
          )}
          <p className="text-xs text-stone-500">
            {trimmedOrderSearch
              ? 'Ningún pedido coincide con esa búsqueda.'
              : orderStatusFilter === 'unassigned'
                ? 'Ningún pedido sin asignación en esta ruta.'
                : 'Ningún pedido con ese estado en esta ruta.'}
          </p>
          <button
            type="button"
            className="text-[11px] font-medium text-primary-700 dark:text-primary-300 hover:underline cursor-pointer"
            onClick={() => {
              setOrderStatusFilter('all');
              setOrderSearchQuery('');
            }}
          >
            Ver todos ({assigned.length})
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {visibleAssigned.map((o) => {
              const orderIndex = assignedIndexById.get(o.id) ?? 0;
              return (
                <RouteDetailOrderListItem key={o.id} o={o} orderIndex={orderIndex} {...s} />
              );
            })}
          </ul>
          {filteredAssigned.length > visibleAssigned.length ? (
            <div className="flex flex-col items-center gap-1 pt-2">
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Mostrando {visibleAssigned.length} de {filteredAssigned.length} pedidos
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setVisibleOrderCount((n) => Math.min(n + ORDERS_PAGE_SIZE, filteredAssigned.length))
                }
              >
                Cargar {Math.min(ORDERS_PAGE_SIZE, filteredAssigned.length - visibleAssigned.length)} más
              </Button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
