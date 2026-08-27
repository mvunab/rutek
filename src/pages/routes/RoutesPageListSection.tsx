import {
  ChevronDown, ChevronUp, CheckSquare, Route as RouteIcon, Square,
} from 'lucide-react';
import { clsx } from 'clsx';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatRouteDay, type RouteSortKey } from './routesShared';
import { RouteListItem } from './RouteListItem';
import { RouteTableRow } from './RouteTableRow';
import type { RoutesPageState } from './useRoutesPage';

export function RoutesPageListSection(s: RoutesPageState) {
  const {
    routesLoading,
    routes,
    filteredRoutes,
    layout,
    filterDateRange,
    setShowFilters,
    totalBultos,
    sortCol,
    setSortCol,
    sortDir,
    setSortDir,
    routeAggById,
    routeDateKey,
    selectedRoute,
    setSelectedRoute,
    bulkDeleteMode,
    bulkDeleteSelectedIds,
    toggleBulkDeleteRoute,
    selectAllBulkDelete,
    selectNoneBulkDelete,
    panelOpen,
    detailPanelFullscreen,
  } = s;

  const panelFullscreenActive = panelOpen && detailPanelFullscreen;

  return (
  <div
    className={clsx(
      'flex flex-col min-w-0 flex-1',
      panelOpen && !detailPanelFullscreen && 'max-lg:hidden',
      panelFullscreenActive && 'hidden',
    )}
  >
    <div className="route-list-scroll flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y px-4 sm:px-6 lg:px-8 py-4">
      {routesLoading && routes.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400 py-12 text-center">Cargando rutas…</p>
      ) : filteredRoutes.length === 0 ? (
        <div className="max-w-lg mx-auto">
          <EmptyState
            icon={<RouteIcon size={32} />}
            title={routes.length === 0 ? 'Sin rutas' : 'Sin resultados'}
            description={
              routes.length === 0
                ? 'Crea tu primera ruta con «Nueva ruta» y selecciónala para gestionar pedidos.'
                : 'No hay rutas que coincidan con la búsqueda o los filtros.'
            }
          />
        </div>
      ) : (
        <div className={clsx('w-full space-y-4', layout === 'cards' && 'max-w-lg mx-auto')}>
          {/* Barra de resumen + sort */}
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-700 dark:text-stone-200 tabular-nums">
                  {filteredRoutes.length}
                </span>{' '}
                de{' '}
                <span className="tabular-nums">{routes.length}</span> rutas ·{' '}
                <span className="tabular-nums">{totalBultos}</span> bultos
              </p>
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                aria-label="Cambiar período de fecha"
              >
                {filterDateRange === '7d' && '7 días'}
                {filterDateRange === '30d' && '30 días'}
                {filterDateRange === 'month' && 'Mes en curso'}
                {filterDateRange === '90d' && '90 días'}
                {filterDateRange === 'all' && 'Todo el historial'}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-stone-400 uppercase tracking-wide hidden sm:inline">
                Ordenar
              </span>
              <select
                value={sortCol ?? ''}
                onChange={(e) => {
                  const v = e.target.value as RouteSortKey | '';
                  if (!v) { setSortCol(null); setSortDir(null); }
                  else { setSortCol(v); setSortDir('desc'); }
                }}
                className="text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-2 py-1 text-stone-700 dark:text-stone-200"
                aria-label="Ordenar rutas"
              >
                <option value="createdAt">Fecha creación</option>
                <option value="code">N° Ruta</option>
                <option value="fecha">Fecha planificación</option>
                <option value="pedidos">Pedidos</option>
                <option value="status">Estado</option>
              </select>
            </div>
          </div>

          {/* ── Vista tarjetas ── */}
          {layout === 'cards' && (
            <ul className="space-y-2" role="list">
              {filteredRoutes.map((r) => {
                const agg = routeAggById.get(r.id) ?? { pedidos: 0, bultos: 0, delivered: 0, rejected: 0, vehiclesLabel: '', driversLabel: '' };
                return (
                  <li key={r.id}>
                    <RouteListItem
                      route={r}
                      agg={agg}
                      fecha={formatRouteDay(routeDateKey(r))}
                      selected={selectedRoute?.id === r.id}
                      onSelect={() => setSelectedRoute(r)}
                      bulkMode={bulkDeleteMode}
                      bulkChecked={bulkDeleteSelectedIds.has(r.id)}
                      onBulkToggle={() => toggleBulkDeleteRoute(r.id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {/* ── Vista tabla ── */}
          {layout === 'table' && (
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left table-fixed">
                  <colgroup>
                    <col className="w-[7.5rem]" />
                    <col className="w-auto" />
                    <col className="w-[7.5rem]" />
                    <col className="w-[6.5rem]" />
                    <col className="w-[4.5rem]" />
                    <col className="w-[4.5rem]" />
                    <col className="w-[6.5rem]" />
                    <col className="w-[8rem]" />
                  </colgroup>
                  <thead className="bg-stone-50 dark:bg-stone-800/70 border-b border-stone-200 dark:border-stone-700">
                    <tr>
                      {bulkDeleteMode ? (
                        <th scope="col" className="px-3 py-2.5 w-10">
                          <button
                            type="button"
                            onClick={() => {
                              const allSelected = filteredRoutes.every((r) => bulkDeleteSelectedIds.has(r.id));
                              if (allSelected) selectNoneBulkDelete();
                              else selectAllBulkDelete();
                            }}
                            className="p-0.5 rounded text-primary-600 dark:text-primary-400 hover:bg-stone-200/80 dark:hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            aria-label={
                              filteredRoutes.every((r) => bulkDeleteSelectedIds.has(r.id))
                                ? 'Deseleccionar todas las rutas visibles'
                                : 'Seleccionar todas las rutas visibles'
                            }
                          >
                            {filteredRoutes.length > 0 && filteredRoutes.every((r) => bulkDeleteSelectedIds.has(r.id)) ? (
                              <CheckSquare size={16} aria-hidden />
                            ) : (
                              <Square size={16} className="text-stone-400" aria-hidden />
                            )}
                          </button>
                        </th>
                      ) : null}
                      {[
                        { label: 'N° Ruta', col: 'code' as RouteSortKey, align: 'left' as const },
                        { label: 'Nombre', col: 'name' as RouteSortKey, align: 'left' as const },
                        { label: 'Estado', col: 'status' as RouteSortKey, align: 'left' as const },
                        { label: 'Fecha', col: 'fecha' as RouteSortKey, align: 'left' as const },
                        { label: 'Pedidos', col: 'pedidos' as RouteSortKey, align: 'right' as const },
                        { label: 'Bultos', col: 'bultos' as RouteSortKey, align: 'right' as const },
                        { label: 'Vehículo', col: 'vehiclePlate' as RouteSortKey, align: 'left' as const },
                        { label: 'Chofer', col: 'driverName' as RouteSortKey, align: 'left' as const },
                      ].map(({ label, col, align }) => (
                        <th
                          key={label}
                          scope="col"
                          className={clsx(
                            'px-4 py-2.5 text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide whitespace-nowrap',
                            align === 'right' ? 'text-right' : 'text-left',
                          )}
                        >
                          {col ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
                                else { setSortCol(col); setSortDir('desc'); }
                              }}
                              className={clsx(
                                'inline-flex items-center gap-1 w-full uppercase tracking-wide',
                                'cursor-pointer hover:text-stone-700 dark:hover:text-stone-200 select-none',
                                align === 'right' ? 'justify-end' : 'justify-start',
                              )}
                            >
                              {label}
                              {sortCol === col && (
                                sortDir === 'asc' ? <ChevronUp size={11} aria-hidden /> : <ChevronDown size={11} aria-hidden />
                              )}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1">{label}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-stone-900">
                    {filteredRoutes.map((r) => {
                      const agg = routeAggById.get(r.id) ?? { pedidos: 0, bultos: 0, delivered: 0, rejected: 0, vehiclesLabel: '', driversLabel: '' };
                      return (
                        <RouteTableRow
                          key={r.id}
                          route={r}
                          agg={agg}
                          fecha={formatRouteDay(routeDateKey(r))}
                          selected={selectedRoute?.id === r.id}
                          onSelect={() => setSelectedRoute(r)}
                          bulkMode={bulkDeleteMode}
                          bulkChecked={bulkDeleteSelectedIds.has(r.id)}
                          onBulkToggle={() => toggleBulkDeleteRoute(r.id)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
}
