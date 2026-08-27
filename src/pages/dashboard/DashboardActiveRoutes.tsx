import { ArrowRight, Clock, Map, Truck } from 'lucide-react';
import { RouteStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatRouteDisplayLabel } from '../../lib/routeSequence';
import type { Order, Route } from '../../types';
import { ACTIVE_ROUTES_PAGE_SIZE } from './dashboardActiveRoutesConstants';

export function DashboardActiveRoutes({
  activeRoutes,
  paginatedRoutes,
  activeRoutesPage,
  activeRoutesTotalPages,
  orders,
  onPageChange,
  onViewRoutes,
}: {
  activeRoutes: Route[];
  paginatedRoutes: Route[];
  activeRoutesPage: number;
  activeRoutesTotalPages: number;
  orders: Order[];
  onPageChange: (updater: (p: number) => number) => void;
  onViewRoutes: () => void;
}) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
        <div>
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Rutas activas</h3>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            {activeRoutes.length > 0
              ? `${activeRoutes.length} en curso · máx. ${ACTIVE_ROUTES_PAGE_SIZE} por página`
              : 'Itinerario: pedidos y bultos totales'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onViewRoutes}
          icon={<ArrowRight size={16} aria-hidden />}
          iconPosition="right"
        >
          Ver rutas
        </Button>
      </div>
      <div className="divide-y divide-stone-50 dark:divide-stone-800">
        {paginatedRoutes.map((route) => {
          const totalInRoute = orders.filter((o) => o.routeId === route.id).length;
          const deliveredInRoute = orders.filter(
            (o) => o.routeId === route.id && o.status === 'delivered',
          ).length;
          const showProgress = totalInRoute > 0 && route.status !== 'cancelled';
          const pct = showProgress ? Math.round((deliveredInRoute / totalInRoute) * 100) : 0;

          return (
            <div key={route.id} className="px-5 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-200 tabular-nums" translate="no">
                    N° {formatRouteDisplayLabel(route)}
                  </span>
                  <RouteStatusBadge status={route.status} />
                </div>
                <span className="text-xs text-stone-400 dark:text-stone-500">{route.orderIds.length} paradas</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-stone-400 dark:text-stone-500">
                <span className="flex items-center gap-1">
                  <Truck size={11} />
                  {route.driverName ?? 'Sin asignar'}
                </span>
                <span className="flex items-center gap-1">
                  <Map size={11} />
                  {route.estimatedDistance} km
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m
                </span>
              </div>
              {showProgress ? (
                <div
                  className="mt-2.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1"
                  title={`${deliveredInRoute}/${totalInRoute} pedidos entregados`}
                >
                  <div
                    className="bg-primary-500 h-1 rounded-full"
                    style={{ width: `${pct}%`, transition: 'width 0.25s ease' }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
        {activeRoutes.length === 0 && (
          <div className="p-8 text-center text-sm text-stone-400 dark:text-stone-500">No hay rutas activas</div>
        )}
      </div>
      {activeRoutes.length > ACTIVE_ROUTES_PAGE_SIZE ? (
        <div
          className="flex items-center justify-between gap-2 px-5 py-3 border-t border-stone-100 dark:border-stone-800"
          aria-label="Paginación de rutas activas"
        >
          <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
            Página {activeRoutesPage} de {activeRoutesTotalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={activeRoutesPage <= 1}
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={activeRoutesPage >= activeRoutesTotalPages}
              onClick={() => onPageChange((p) => Math.min(activeRoutesTotalPages, p + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
