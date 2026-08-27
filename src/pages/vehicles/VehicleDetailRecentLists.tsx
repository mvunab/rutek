import type { Order, Route } from '../../types';
import { formatVehicleDate } from '../../lib/vehicleLabels';
import { routeStatusLabel } from '../../lib/routeStatusLabels';
import { formatRouteDisplayLabel, formatRouteDisplayTitle } from '../../lib/routeSequence';
import { OrderStatusBadge, RouteStatusBadge } from '../../components/ui/Badge';

const RECENT_LIMIT = 8;

function RecentRoutesSection({
  relatedRoutes,
  routeCount,
  onNavigate,
}: {
  relatedRoutes: Route[];
  routeCount: number;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Rutas recientes</h2>
        {routeCount > RECENT_LIMIT && (
          <span className="text-xs text-stone-500 tabular-nums">
            Mostrando {RECENT_LIMIT} de {routeCount}
          </span>
        )}
      </div>
      {relatedRoutes.length === 0 ? (
        <p className="px-5 py-8 text-sm text-stone-600 dark:text-stone-400 text-center">
          Sin rutas asignadas a este vehículo.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {relatedRoutes.map((route) => (
            <li key={route.id}>
              <button
                type="button"
                onClick={() => onNavigate('/rutas')}
                className="w-full text-left flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer transition-colors duration-200 hover:bg-stone-50 dark:hover:bg-stone-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/40"
              >
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate"
                    translate="no"
                  >
                    {formatRouteDisplayTitle(route)}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400 truncate tabular-nums">
                    N° {formatRouteDisplayLabel(route)} · {formatVehicleDate(route.createdAt)} ·{' '}
                    {routeStatusLabel(route.status)}
                  </p>
                </div>
                <RouteStatusBadge status={route.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentOrdersSection({
  relatedOrders,
  orderCount,
  onNavigate,
}: {
  relatedOrders: Order[];
  orderCount: number;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Pedidos recientes</h2>
        {orderCount > RECENT_LIMIT && (
          <span className="text-xs text-stone-500 tabular-nums">
            Mostrando {RECENT_LIMIT} de {orderCount}
          </span>
        )}
      </div>
      {relatedOrders.length === 0 ? (
        <p className="px-5 py-8 text-sm text-stone-600 dark:text-stone-400 text-center">
          Sin pedidos asignados a este vehículo.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {relatedOrders.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => onNavigate('/rutas')}
                className="w-full text-left flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer transition-colors duration-200 hover:bg-stone-50 dark:hover:bg-stone-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/40"
              >
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate"
                    translate="no"
                  >
                    {order.code}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
                    {order.clientName} · {order.destination?.city || '—'}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function VehicleDetailRecentLists({
  relatedRoutes,
  relatedOrders,
  routeCount,
  orderCount,
  onNavigate,
}: {
  relatedRoutes: Route[];
  relatedOrders: Order[];
  routeCount: number;
  orderCount: number;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <RecentRoutesSection
        relatedRoutes={relatedRoutes}
        routeCount={routeCount}
        onNavigate={onNavigate}
      />
      <RecentOrdersSection
        relatedOrders={relatedOrders}
        orderCount={orderCount}
        onNavigate={onNavigate}
      />
    </div>
  );
}
