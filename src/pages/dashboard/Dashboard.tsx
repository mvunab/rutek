import { useEffect, useMemo } from 'react';
import {
  Package, Truck, Users, Map, TrendingUp, Clock,
  CheckCircle2, AlertCircle, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { StatCard } from '../../components/ui/Card';
import { OrderStatusBadge, RouteStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useRouteStore } from '../../store/useRouteStore';
import { useClientStore } from '../../store/useClientStore';
import { EntityStatusBreakdown } from '../../components/dashboard/EntityStatusBreakdown';
import {
  buildOrderStatusBreakdown,
  buildRouteStatusBreakdown,
  computeDashboardKpis,
  kpiOrdersTotalSubtitle,
  mergeDashboardStats,
  orderStatusToChartPoints,
} from '../../lib/dashboardStatusBreakdown';


const CHART_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

export function Dashboard() {
  const navigate = useNavigate();
  const { user, tenant, isSuperAdmin } = useAuthStore();
  const { stats, ordersChart, statusChart, fetchDashboard } = useDashboardStore();
  const { orders, fetchOrders } = useOrderStore();
  const { routes, fetchRoutes } = useRouteStore();
  const { clients, fetchClients } = useClientStore();

  useEffect(() => {
    if (!isSuperAdmin) {
      void fetchDashboard();
      void fetchOrders();
      void fetchRoutes();
      void fetchClients();
    }
  }, [isSuperAdmin, fetchDashboard, fetchOrders, fetchRoutes, fetchClients]);

  if (isSuperAdmin) {
    navigate('/super-admin', { replace: true });
    return null;
  }

  const recentOrders = orders.slice(0, 4);
  const activeRoutes = routes.filter(
    (r) => r.status === 'not_started' || r.status === 'in_progress',
  );

  const routeStatusRows = useMemo(() => buildRouteStatusBreakdown(routes), [routes]);
  const orderStatusRows = useMemo(
    () => buildOrderStatusBreakdown(orders, tenant),
    [orders, tenant],
  );

  const effectiveStatusChart = useMemo(() => {
    if (statusChart.length > 0) return statusChart;
    return orderStatusToChartPoints(orders, tenant);
  }, [statusChart, orders, tenant]);

  const kpis = useMemo(
    () =>
      mergeDashboardStats(
        stats,
        computeDashboardKpis(orders, routes, clients.length),
      ),
    [stats, orders, routes, clients.length],
  );

  const ordersTotalSubtitle = useMemo(() => kpiOrdersTotalSubtitle(orders), [orders]);

  const hasOrdersChart = ordersChart.length > 0;
  const hasStatusChart = effectiveStatusChart.length > 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Buen día, {user?.name.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Aquí tienes el resumen operacional de hoy
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg">
          <span aria-hidden="true" className="size-2 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Operación activa</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pedidos totales"
          value={orders.length}
          subtitle={ordersTotalSubtitle}
          icon={<Package size={20} />}
          color="blue"
        />
        <StatCard
          title="En tránsito"
          value={kpis.ordersInTransit}
          subtitle="Estado: en ruta"
          icon={<Truck size={20} />}
          color="violet"
        />
        <StatCard
          title="Entregados"
          value={kpis.ordersDelivered}
          subtitle={`${kpis.deliveryRate}% de efectividad`}
          icon={<CheckCircle2 size={20} />}
          color="emerald"
        />
        <StatCard
          title="Pendientes"
          value={kpis.ordersPending}
          subtitle="Estado: pendiente"
          icon={<AlertCircle size={20} />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EntityStatusBreakdown
          title="Rutas por estado"
          subtitle="Distribución de todos los itinerarios"
          icon={<Map size={18} />}
          total={routes.length}
          rows={routeStatusRows}
          emptyMessage="No hay rutas registradas"
          onViewAll={() => navigate('/rutas')}
          viewAllLabel="Ver rutas"
        />
        <EntityStatusBreakdown
          title="Pedidos por estado"
          subtitle="Distribución de todos los pedidos"
          icon={<Package size={18} />}
          total={orders.length}
          rows={orderStatusRows}
          emptyMessage="No hay pedidos registrados"
          onViewAll={() => navigate('/pedidos')}
          viewAllLabel="Ver pedidos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders chart */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Pedidos de la semana</h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Creados vs entregados</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary-500 rounded inline-block" /> Creados</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 rounded inline-block" /> Entregados</span>
            </div>
          </div>
          {hasOrdersChart ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ordersChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f0ec" />
                <XAxis dataKey="label" tick={{ fill: '#a8a29e', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a8a29e', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  labelStyle={{ color: '#57534e' }}
                  itemStyle={{ color: '#292524' }}
                />
                <Area type="monotone" dataKey="value" name="Creados" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCreated)" dot={false} />
                <Area type="monotone" dataKey="value2" name="Entregados" stroke="#10b981" strokeWidth={2} fill="url(#colorDelivered)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-stone-400 dark:text-stone-500">
              Sin datos para mostrar
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-1">Estado de pedidos</h3>
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">Distribución actual</p>
          {hasStatusChart ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={effectiveStatusChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {effectiveStatusChart.map((entry, index) => (
                      <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {effectiveStatusChart.map((item, i) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className="size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i] }} />
                      <span className="text-xs text-stone-500 dark:text-stone-400">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-sm text-stone-400 dark:text-stone-500">
              Sin datos para mostrar
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Pedidos recientes</h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Para agrupar en rutas</p>
            </div>
            <Button variant="ghost" size="xs" onClick={() => navigate('/rutas')} icon={<ArrowRight size={12} />} iconPosition="right">
              Ir a rutas
            </Button>
          </div>
          <div className="divide-y divide-stone-50 dark:divide-stone-800">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-stone-400 dark:text-stone-500">
                Sin pedidos para mostrar
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-200">{order.code}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{order.clientName}</p>
                  </div>
                  <p className="text-xs text-stone-400 dark:text-stone-500 flex-shrink-0">{order.estimatedDelivery}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Routes */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Rutas activas</h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Itinerario: pedidos y bultos totales</p>
            </div>
            <Button variant="ghost" size="xs" onClick={() => navigate('/rutas')} icon={<ArrowRight size={12} />} iconPosition="right">
              Ver rutas
            </Button>
          </div>
          <div className="divide-y divide-stone-50 dark:divide-stone-800">
            {activeRoutes.map((route) => (
              <div key={route.id} className="px-5 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-200">{route.code}</span>
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
                {(() => {
                  const totalInRoute = orders.filter((o) => o.routeId === route.id).length;
                  const deliveredInRoute = orders.filter(
                    (o) => o.routeId === route.id && o.status === 'delivered',
                  ).length;
                  if (totalInRoute === 0 || route.status === 'cancelled') return null;
                  const pct = Math.round((deliveredInRoute / totalInRoute) * 100);
                  return (
                    <div
                      className="mt-2.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1"
                      title={`${deliveredInRoute}/${totalInRoute} pedidos entregados`}
                    >
                      <div
                        className="bg-primary-500 h-1 rounded-full"
                        style={{ width: `${pct}%`, transition: 'width 0.25s ease' }}
                      />
                    </div>
                  );
                })()}
              </div>
            ))}
            {activeRoutes.length === 0 && (
              <div className="p-8 text-center text-sm text-stone-400 dark:text-stone-500">No hay rutas activas</div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Rutas activas', value: kpis.activeRoutes, icon: <Map size={16} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
          { label: 'Cuentas', value: kpis.totalClients, icon: <Users size={16} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Efectividad', value: `${kpis.deliveryRate}%`, icon: <TrendingUp size={16} />, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
          { label: 'Tiempo prom.', value: kpis.avgDeliveryTime > 0 ? `${kpis.avgDeliveryTime} d` : '—', icon: <Clock size={16} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-lg ${item.bg} dark:opacity-90 ${item.color}`}>{item.icon}</div>
            <div>
              <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{item.value}</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
