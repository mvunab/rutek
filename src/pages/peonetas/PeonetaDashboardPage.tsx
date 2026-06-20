import { useEffect, useMemo } from 'react';
import { Truck, Package, MapPin, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouteStore } from '../../store/useRouteStore';
import { useOrderStore } from '../../store/useOrderStore';
import { resolveOrderStatusLabel } from '../../lib/orderStatusLabels';
import { Card } from '../../components/ui/Card';
import type { Route, Order } from '../../types';
import { formatRouteDisplayTitle } from '../../lib/routeSequence';

const ROUTE_STATUS_LABEL: Record<string, string> = {
  not_started: 'Sin iniciar',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

function routeStatusColor(status: string) {
  if (status === 'in_progress') return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300';
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (status === 'cancelled') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300';
}

function orderStatusColor(status: string) {
  if (status === 'delivered') return 'text-emerald-600 dark:text-emerald-400';
  if (status === 'in_transit') return 'text-violet-600 dark:text-violet-400';
  if (status === 'rejected') return 'text-red-600 dark:text-red-400';
  return 'text-stone-500 dark:text-stone-400';
}

function OrderStatusIcon({ status }: { status: string }) {
  if (status === 'delivered') return <CheckCircle2 size={13} className="text-emerald-500 shrink-0" aria-hidden />;
  if (status === 'rejected') return <XCircle size={13} className="text-red-500 shrink-0" aria-hidden />;
  if (status === 'in_transit') return <Truck size={13} className="text-violet-500 shrink-0" aria-hidden />;
  return <Clock size={13} className="text-stone-400 shrink-0" aria-hidden />;
}

interface RouteCard {
  route: Route;
  myOrders: Order[];
}

export function PeonetaDashboardPage() {
  const { user, tenant } = useAuthStore();
  const { routes, fetchRoutes, loading: routesLoading, loaded: routesLoaded } = useRouteStore();
  const { orders, fetchOrders, loading: ordersLoading, loaded: ordersLoaded } = useOrderStore();

  useEffect(() => {
    if (!routesLoaded) void fetchRoutes();
  }, [routesLoaded, fetchRoutes]);

  useEffect(() => {
    if (!ordersLoaded) void fetchOrders();
  }, [ordersLoaded, fetchOrders]);

  const myRouteCards = useMemo((): RouteCard[] => {
    if (!user) return [];
    const myOrders = orders.filter((o) => o.peonetaId === user.id);
    if (myOrders.length === 0) return [];

    const routeIds = new Set(myOrders.map((o) => o.routeId).filter(Boolean) as string[]);
    const routeMap = new Map(routes.map((r) => [r.id, r]));

    const cards: RouteCard[] = [];
    for (const routeId of routeIds) {
      const route = routeMap.get(routeId);
      if (!route || route.status === 'cancelled') continue;
      const ordersInRoute = myOrders.filter((o) => o.routeId === routeId);
      cards.push({ route, myOrders: ordersInRoute });
    }

    // Activas primero, luego por fecha de inicio
    return cards.sort((a, b) => {
      const rank = { in_progress: 0, not_started: 1, completed: 2, cancelled: 3 };
      const ra = rank[a.route.status as keyof typeof rank] ?? 2;
      const rb = rank[b.route.status as keyof typeof rank] ?? 2;
      if (ra !== rb) return ra - rb;
      return (a.route.startTime ?? '').localeCompare(b.route.startTime ?? '');
    });
  }, [user, orders, routes]);

  const isLoading = (routesLoading && !routesLoaded) || (ordersLoading && !ordersLoaded);

  const delivered = myRouteCards
    .flatMap((c) => c.myOrders)
    .filter((o) => o.status === 'delivered').length;
  const total = myRouteCards.flatMap((c) => c.myOrders).length;

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Hola, {user?.name?.split(' ')[0] ?? 'peoneta'}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </p>
        </div>
        {total > 0 && (
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 tabular-nums">
              {delivered}/{total}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">pedidos entregados</p>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && myRouteCards.length === 0 && (
        <Card padding="lg">
          <div className="flex flex-col items-center py-8 gap-3 text-center">
            <div className="p-3 rounded-full bg-stone-100 dark:bg-stone-800">
              <Truck size={24} className="text-stone-400 dark:text-stone-500" aria-hidden />
            </div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Sin rutas asignadas
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 max-w-xs">
              Aún no tienes pedidos asignados en ninguna ruta activa. El operador te asignará cuando corresponda.
            </p>
          </div>
        </Card>
      )}

      {!isLoading && myRouteCards.map(({ route, myOrders }) => {
        const delivered = myOrders.filter((o) => o.status === 'delivered').length;
        const startFormatted = route.startTime
          ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(route.startTime))
          : null;

        return (
          <Card key={route.id} padding="none">
            {/* Cabecera de ruta */}
            <div className="flex items-start gap-3 px-4 py-3 border-b border-stone-100 dark:border-stone-800">
              <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 shrink-0">
                <Truck size={16} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate" translate="no">
                    {formatRouteDisplayTitle(route)}
                  </p>
                  <span
                    className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                      routeStatusColor(route.status),
                    )}
                  >
                    {ROUTE_STATUS_LABEL[route.status] ?? route.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                    <Package size={11} className="inline mr-0.5" aria-hidden />
                    {delivered}/{myOrders.length} entregados
                  </span>
                  {route.driverName && (
                    <span className="text-xs text-stone-400 dark:text-stone-500 truncate">
                      Chofer: {route.driverName}
                    </span>
                  )}
                  {startFormatted && (
                    <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                      <Clock size={11} className="inline mr-0.5" aria-hidden />
                      {startFormatted}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de pedidos asignados */}
            <ul className="divide-y divide-stone-100 dark:divide-stone-800" aria-label={`Pedidos de la ruta ${formatRouteDisplayTitle(route)}`}>
              {myOrders.map((order) => {
                const label = resolveOrderStatusLabel(order.status, tenant);
                return (
                  <li key={order.id} className="flex items-start gap-3 px-4 py-3">
                    <OrderStatusIcon status={order.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
                          {order.clientName}
                        </p>
                        <span className={clsx('text-xs font-medium shrink-0', orderStatusColor(order.status))}>
                          {label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0 mt-0.5">
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate flex items-center gap-1">
                          <MapPin size={10} aria-hidden />
                          {order.destination.street}, {order.destination.city}
                        </p>
                        <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                          {order.bultos} {order.bultos === 1 ? 'bulto' : 'bultos'}
                        </span>
                        {order.vehiclePlate && (
                          <span className="text-xs font-mono text-stone-400 dark:text-stone-500" translate="no">
                            {order.vehiclePlate}
                          </span>
                        )}
                      </div>
                      {order.notes && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle size={10} aria-hidden />
                          {order.notes}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
