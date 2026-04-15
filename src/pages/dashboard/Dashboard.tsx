import {
  Package, Truck, Users, Map, TrendingUp, Clock,
  CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { StatCard } from '../../components/ui/Card';
import { OrderStatusBadge, RouteStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { mockDashboardStats, mockOrdersChart, mockStatusChart, mockOrders, mockRoutes } from '../../data/mockData';
import { useAuthStore } from '../../store/useAuthStore';

const CHART_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const stats = mockDashboardStats;
  const recentOrders = mockOrders.slice(0, 4);
  const activeRoutes = mockRoutes.filter(r => r.status === 'active' || r.status === 'planned');

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Buen día, {user?.name.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Aquí tienes el resumen operacional de hoy
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">Operación activa</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pedidos totales"
          value={stats.totalOrders}
          subtitle="Este mes"
          icon={<Package size={20} />}
          color="blue"
          trend={{ value: 12.5, label: 'vs mes anterior' }}
        />
        <StatCard
          title="En tránsito"
          value={stats.ordersInTransit}
          subtitle="Pedidos activos"
          icon={<Truck size={20} />}
          color="violet"
          trend={{ value: 3, label: 'vs ayer' }}
        />
        <StatCard
          title="Entregados"
          value={stats.ordersDelivered}
          subtitle={`${stats.deliveryRate}% de efectividad`}
          icon={<CheckCircle2 size={20} />}
          color="emerald"
          trend={{ value: 5.8, label: 'vs mes anterior' }}
        />
        <StatCard
          title="Pendientes"
          value={stats.ordersPending}
          subtitle="Requieren atención"
          icon={<AlertCircle size={20} />}
          color="amber"
          trend={{ value: -2, label: 'vs ayer' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders chart */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Pedidos de la semana</h3>
              <p className="text-xs text-stone-400 mt-0.5">Creados vs entregados</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary-500 rounded inline-block" /> Creados</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 rounded inline-block" /> Entregados</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockOrdersChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
        </div>

        {/* Pie chart */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-800 mb-1">Estado de pedidos</h3>
          <p className="text-xs text-stone-400 mb-4">Distribución actual</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={mockStatusChart}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                dataKey="value"
                paddingAngle={3}
              >
                {mockStatusChart.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {mockStatusChart.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i] }} />
                  <span className="text-xs text-stone-500">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-stone-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Pedidos recientes</h3>
              <p className="text-xs text-stone-400 mt-0.5">Últimas actualizaciones</p>
            </div>
            <Button variant="ghost" size="xs" onClick={() => navigate('/pedidos')} icon={<ArrowRight size={12} />} iconPosition="right">
              Ver todos
            </Button>
          </div>
          <div className="divide-y divide-stone-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono font-semibold text-stone-700">{order.code}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-stone-400 truncate">{order.clientName}</p>
                </div>
                <p className="text-xs text-stone-400 flex-shrink-0">{order.estimatedDelivery}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Routes */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Rutas activas</h3>
              <p className="text-xs text-stone-400 mt-0.5">Operación en tiempo real</p>
            </div>
            <Button variant="ghost" size="xs" onClick={() => navigate('/rutas')} icon={<ArrowRight size={12} />} iconPosition="right">
              Ver todas
            </Button>
          </div>
          <div className="divide-y divide-stone-50">
            {activeRoutes.map((route) => (
              <div key={route.id} className="px-5 py-3.5 hover:bg-stone-50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-stone-700">{route.code}</span>
                    <RouteStatusBadge status={route.status} />
                  </div>
                  <span className="text-xs text-stone-400">{route.orderIds.length} pedidos</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-400">
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
                {route.status === 'active' && (
                  <div className="mt-2.5 w-full bg-stone-100 rounded-full h-1">
                    <div
                      className="bg-primary-500 h-1 rounded-full transition-all"
                      style={{
                        width: `${(route.stops.filter(s => s.status === 'completed').length / route.stops.length) * 100}%`
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            {activeRoutes.length === 0 && (
              <div className="p-8 text-center text-sm text-stone-400">No hay rutas activas</div>
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
          <div key={item.label} className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>{item.icon}</div>
            <div>
              <p className="text-xl font-bold text-stone-900">{item.value}</p>
              <p className="text-xs text-stone-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
