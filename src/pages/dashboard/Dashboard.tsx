import { useEffect } from 'react';
import {
  Package, Truck, Users, Map, TrendingUp, Clock,
  CheckCircle2, AlertCircle, ArrowRight,
  Route, UserCheck,
  PersonStanding, Building2,
  ShieldCheck, Camera, ChevronRight
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

// ─── Back Office Quick Access ─────────────────────────────────────────────────
interface MenuItem {
  label: string;
  description?: string;
  icon: React.ReactNode;
  to?: string;
  soon?: boolean;
  accent: string;   // tailwind bg color for icon bg
  iconColor: string; // tailwind text color for icon
}

function BackOfficeMenu() {
  const navigate = useNavigate();

  const operaciones: MenuItem[] = [
    {
      label: 'Administrador de Rutas',
      description: 'Gestiona y monitorea las rutas del día',
      icon: <Route size={18} />,
      to: '/rutas',
      accent: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ];

  const administracion: MenuItem[] = [
    { label: 'Repartidores',       icon: <UserCheck size={15} />,     to: '/usuarios',  accent: 'bg-orange-100', iconColor: 'text-orange-500' },
    { label: 'Peonetas',           icon: <PersonStanding size={15}/>, to: '/peonetas', accent: 'bg-orange-100', iconColor: 'text-orange-500' },
    { label: 'Clientes',           icon: <Building2 size={15} />,      to: '/clientes',  accent: 'bg-red-100',    iconColor: 'text-red-500' },
    { label: 'Usuarios Sistema',   icon: <ShieldCheck size={15} />,  to: '/usuarios',  accent: 'bg-violet-100', iconColor: 'text-violet-500' },
    { label: 'Admin. Fotos',       icon: <Camera size={15} />,       to: '/fotos',     accent: 'bg-blue-100',   iconColor: 'text-blue-600' },
  ];

  const go = (item: MenuItem) => {
    if (!item.soon && item.to) navigate(item.to);
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Accesos rápidos</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Operaciones — destacadas */}
        <div>
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">Operaciones</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {operaciones.map(item => (
              <button
                key={item.label}
                onClick={() => go(item)}
                disabled={item.soon}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all group
                  ${item.soon
                    ? 'border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 cursor-not-allowed opacity-60'
                    : 'border-stone-200 dark:border-stone-700 hover:border-primary-200 dark:hover:border-primary-600 hover:bg-primary-50/40 dark:hover:bg-primary-950/30 hover:shadow-sm cursor-pointer'
                  }`}
              >
                <div className={`flex-shrink-0 p-2 rounded-lg ${item.accent}`}>
                  <span className={item.iconColor}>{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 leading-tight">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate">{item.description}</p>
                  )}
                </div>
                {item.soon
                  ? <span className="flex-shrink-0 text-[10px] font-semibold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded-full">Pronto</span>
                  : <ChevronRight size={14} className="flex-shrink-0 text-stone-300 dark:text-stone-600 group-hover:text-primary-400 transition-colors" />
                }
              </button>
            ))}
          </div>
        </div>

        {/* Administración — grid compacto */}
        <div>
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">Administración</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {administracion.map(item => (
              <button
                key={item.label}
                onClick={() => go(item)}
                disabled={item.soon}
                title={item.soon ? 'Próximamente' : item.label}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all group
                  ${item.soon
                    ? 'border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 cursor-not-allowed opacity-50'
                    : 'border-stone-200 dark:border-stone-700 hover:border-primary-200 dark:hover:border-primary-600 hover:bg-primary-50/40 dark:hover:bg-primary-950/30 hover:shadow-sm cursor-pointer'
                  }`}
              >
                <div className={`p-2 rounded-lg ${item.accent}`}>
                  <span className={item.iconColor}>{item.icon}</span>
                </div>
                <span className="text-[11px] font-medium text-stone-600 dark:text-stone-300 leading-tight line-clamp-2">
                  {item.label}
                </span>
                {item.soon && (
                  <span className="text-[9px] text-stone-400 dark:text-stone-500">Pronto</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const CHART_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

export function Dashboard() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuthStore();
  const { stats, ordersChart, statusChart, fetchDashboard } = useDashboardStore();
  const { orders, fetchOrders } = useOrderStore();
  const { routes, fetchRoutes } = useRouteStore();

  useEffect(() => {
    if (!isSuperAdmin) {
      void fetchDashboard();
      void fetchOrders();
      void fetchRoutes();
    }
  }, [isSuperAdmin, fetchDashboard, fetchOrders, fetchRoutes]);

  if (isSuperAdmin) {
    navigate('/super-admin', { replace: true });
    return null;
  }

  const recentOrders = orders.slice(0, 4);
  const activeRoutes = routes.filter(
    (r) => r.status === 'not_started' || r.status === 'in_progress',
  );
  const hasOrdersChart = ordersChart.length > 0;
  const hasStatusChart = statusChart.length > 0;

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

      {/* Back Office Quick Access */}
      <BackOfficeMenu />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pedidos totales"
          value={stats.totalOrders}
          subtitle="Este mes"
          icon={<Package size={20} />}
          color="blue"
        />
        <StatCard
          title="En tránsito"
          value={stats.ordersInTransit}
          subtitle="Pedidos activos"
          icon={<Truck size={20} />}
          color="violet"
        />
        <StatCard
          title="Entregados"
          value={stats.ordersDelivered}
          subtitle={`${stats.deliveryRate}% de efectividad`}
          icon={<CheckCircle2 size={20} />}
          color="emerald"
        />
        <StatCard
          title="Pendientes"
          value={stats.ordersPending}
          subtitle="Requieren atención"
          icon={<AlertCircle size={20} />}
          color="amber"
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
                    data={statusChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {statusChart.map((entry, index) => (
                      <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusChart.map((item, i) => (
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
          { label: 'Rutas activas', value: stats.activeRoutes, icon: <Map size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Clientes', value: stats.totalClients, icon: <Users size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Efectividad', value: `${stats.deliveryRate}%`, icon: <TrendingUp size={16} />, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Tiempo prom.', value: `${stats.avgDeliveryTime}d`, icon: <Clock size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
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
