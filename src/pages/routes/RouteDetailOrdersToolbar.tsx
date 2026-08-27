import {
  CheckSquare, ListChecks, Plus, Search, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import type { RouteDetailPanelState } from './useRouteDetailSidePanel';
import { RouteDetailOrderBulkPanels } from './RouteDetailOrderBulkPanels';

export function RouteDetailOrdersToolbar(s: RouteDetailPanelState) {
  const {
    canManage,
    assigned,
    orderStatusFilter,
    setOrderStatusFilter,
    orderSearchQuery,
    setOrderSearchQuery,
    trimmedOrderSearch,
    filteredAssigned,
    busyId,
    bulkAssignBusy,
    createOrderOpen,
    openCreateOrder,
    orderSelectMode,
    closeOrderSelectMode,
    openOrderSelectMode,
    selectAssignBusy,
    orderAssignBusy,
    bulkAssignOpen,
    closeBulkAssign,
    openBulkAssign,
    orderFilterChips,
  } = s;

  return (
    <>
            <div
              className="sticky top-0 z-[1] space-y-2.5 py-2.5 px-2.5 -mx-0.5 mb-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-surface dark:bg-stone-900"
              role="toolbar"
              aria-label="Acciones sobre pedidos de la ruta"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 px-0.5">
                  <h3 className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Pedidos en ruta
                  </h3>
                  {assigned.length > 0 ? (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums mt-0.5">
                      {orderStatusFilter === 'all' && !trimmedOrderSearch ? (
                        <>{assigned.length} en total</>
                      ) : (
                        <>
                          <span className="font-medium text-stone-700 dark:text-stone-200">
                            {filteredAssigned.length}
                          </span>
                          <span className="text-stone-400"> / {assigned.length}</span>
                          {orderStatusFilter !== 'all' || trimmedOrderSearch ? (
                            <button
                              type="button"
                              onClick={() => {
                                setOrderStatusFilter('all');
                                setOrderSearchQuery('');
                              }}
                              className="ml-2 text-primary-700 dark:text-primary-300 hover:underline cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
                            >
                              Limpiar filtro
                            </button>
                          ) : null}
                        </>
                      )}
                    </p>
                  ) : null}
                </div>
                {canManage ? (
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={<Plus size={14} aria-hidden />}
                      onClick={openCreateOrder}
                      disabled={busyId === 'create' || bulkAssignBusy || createOrderOpen}
                      className={clsx(createOrderOpen && 'ring-2 ring-primary-400/60 ring-offset-1 dark:ring-offset-stone-950')}
                      aria-pressed={createOrderOpen}
                    >
                      Nuevo pedido
                    </Button>
                    {assigned.length > 0 ? (
                      <>
                        <Button
                          type="button"
                          variant={orderSelectMode ? 'primary' : 'secondary'}
                          size="sm"
                          icon={<CheckSquare size={14} aria-hidden />}
                          onClick={() =>
                            orderSelectMode ? closeOrderSelectMode() : openOrderSelectMode()
                          }
                          disabled={
                            bulkAssignBusy ||
                            selectAssignBusy ||
                            orderAssignBusy !== null ||
                            busyId === 'create'
                          }
                          aria-pressed={orderSelectMode}
                        >
                          {orderSelectMode ? 'Cancelar selección' : 'Seleccionar'}
                        </Button>
                        <Button
                          type="button"
                          variant={bulkAssignOpen ? 'violet' : 'violet-soft'}
                          size="sm"
                          icon={<ListChecks size={14} aria-hidden />}
                          onClick={() => (bulkAssignOpen ? closeBulkAssign() : openBulkAssign())}
                          disabled={
                            bulkAssignBusy ||
                            selectAssignBusy ||
                            orderAssignBusy !== null ||
                            busyId === 'create' ||
                            orderSelectMode
                          }
                          aria-pressed={bulkAssignOpen}
                        >
                          {bulkAssignOpen ? 'Listo' : 'Por rangos'}
                        </Button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {assigned.length > 0 ? (
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500"
                    aria-hidden
                  />
                  <input
                    type="search"
                    name="order-search"
                    placeholder="Buscar por referencia, destino, chofer o peoneta…"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    autoComplete="off"
                    aria-label="Buscar pedidos por referencia, destino, chofer o peoneta"
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-stone-950/60 border border-stone-200 dark:border-stone-700 rounded-lg text-[12px] text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                  {orderSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => setOrderSearchQuery('')}
                      aria-label="Limpiar búsqueda"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 cursor-pointer"
                    >
                      <X size={13} aria-hidden />
                    </button>
                  ) : null}
                </div>
              ) : null}

              {assigned.length > 0 ? (
                <div
                  className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 scrollbar-thin"
                  role="group"
                  aria-label="Filtrar pedidos"
                >
                  {orderFilterChips.map((chip) => {
                    const active = orderStatusFilter === chip.value;
                    return (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setOrderStatusFilter(chip.value)}
                        aria-pressed={active}
                        className={clsx(
                          'inline-flex items-center gap-1.5 shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium cursor-pointer',
                          'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                          active
                            ? chip.accent === 'amber'
                              ? 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100'
                              : 'border-primary-400 bg-primary-50 text-primary-900 dark:border-primary-600 dark:bg-primary-950/40 dark:text-primary-100'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300 dark:hover:bg-stone-800',
                        )}
                      >
                        {chip.dotClass ? (
                          <span
                            className={clsx('size-1.5 rounded-full shrink-0', chip.dotClass)}
                            aria-hidden
                          />
                        ) : null}
                        <span className="whitespace-nowrap">{chip.label}</span>
                        <span
                          className={clsx(
                            'tabular-nums rounded-md px-1 py-px text-[10px] font-semibold',
                            active
                              ? chip.accent === 'amber'
                                ? 'bg-amber-200/80 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100'
                                : 'bg-primary-200/70 text-primary-900 dark:bg-primary-900/50 dark:text-primary-100'
                              : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                          )}
                        >
                          {chip.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
      <RouteDetailOrderBulkPanels {...s} />
    </>
  );
}
