import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { routeStatusLabel } from '../../lib/routeStatusLabels';
import { ROUTE_STATUSES, routeStatusDot } from './routesShared';
import type { RoutesPageState } from './useRoutesPage';

export function RoutesPageFiltersPanel(s: RoutesPageState) {
  const {
    routes,
    filterRouteStatus,
    setFilterRouteStatus,
    statusCounts,
    filterClientId,
    setFilterClientId,
    clientFilterOptions,
    clientsWithRoutes,
    filterDateRange,
    setFilterDateRange,
    exportFiltersDescription,
    setShowFilters,
  } = s;

  return (
          <div className="mx-6 rounded-xl glass backdrop-blur-md p-4 shadow-sm space-y-4 shrink-0">
            {/* Filtro por estado */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Estado de la ruta</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterRouteStatus('all')}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                    filterRouteStatus === 'all'
                      ? 'bg-primary-50 dark:bg-primary-950/45 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800'
                      : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-300',
                  )}
                >
                  Todos
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200/80 dark:bg-stone-700 tabular-nums">
                    {routes.length}
                  </span>
                </button>
                {ROUTE_STATUSES.map((s) => {
                  const active = filterRouteStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilterRouteStatus(active ? 'all' : s)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                        active
                          ? 'bg-primary-50 dark:bg-primary-950/45 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800'
                          : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-300',
                      )}
                    >
                      <span className={clsx('size-1.5 rounded-full', routeStatusDot[s])} aria-hidden />
                      {routeStatusLabel(s)}
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200/80 dark:bg-stone-700 tabular-nums">
                        {statusCounts[s] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro por cliente (cuenta mandante) */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Cuenta</p>
              <Select
                id="routes-filter-client"
                label="Cuenta mandante"
                value={filterClientId}
                onChange={(e) => setFilterClientId(e.target.value)}
                options={clientFilterOptions}
                autoComplete="off"
                containerClassName="max-w-md"
                hint={
                  clientsWithRoutes.length === 0
                    ? 'No hay rutas asociadas a cuentas aún.'
                    : 'Incluye rutas con la cuenta asignada o pedidos de ese mandante.'
                }
              />
            </div>

            {/* Filtro por rango de fechas */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Período
                {filterDateRange === '30d' && (
                  <span className="ml-1.5 normal-case font-normal text-stone-400">(por defecto)</span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Rango de fechas">
                {(
                  [
                    { value: '7d', label: 'Últimos 7 días' },
                    { value: '30d', label: 'Últimos 30 días' },
                    { value: 'month', label: 'Mes en curso' },
                    { value: '90d', label: 'Últimos 90 días' },
                    { value: 'all', label: 'Todo el historial' },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilterDateRange(value)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                      filterDateRange === value
                        ? 'bg-primary-50 dark:bg-primary-950/45 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800'
                        : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-300',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-700/60 px-3 py-2">
                <span className="font-medium text-stone-700 dark:text-stone-300">Exportar Excel</span>
                {' '}usa el mismo período y filtros del listado. {exportFiltersDescription}
              </p>
            </div>

            <div className="flex justify-end border-t border-stone-100 dark:border-stone-800 pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterRouteStatus('all');
                  setFilterClientId('all');
                  setFilterDateRange('30d');
                  setShowFilters(false);
                }}
              >
                Restablecer filtros
              </Button>
            </div>
          </div>
  );
}
