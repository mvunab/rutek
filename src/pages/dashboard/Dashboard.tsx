import { useEffect, useMemo, useState } from 'react';
import {
  Package, Truck, CheckCircle2, AlertCircle, Map,
} from 'lucide-react';
import { StatCard } from '../../components/ui/Card';
import { useNavigate, Navigate } from 'react-router-dom';
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
  buildOrdersWeeklyChart,
  ordersWeeklyChartHasActivity,
  enrichStatusChartPoints,
  recentOrdersLast7Days,
} from '../../lib/dashboardStatusBreakdown';
import { DashboardActiveRoutes } from './DashboardActiveRoutes';
import { ACTIVE_ROUTES_PAGE_SIZE } from './dashboardActiveRoutesConstants';
import { DashboardOrdersChart } from './DashboardOrdersChart';
import { DashboardRecentOrders } from './DashboardRecentOrders';
import { DashboardSecondaryStats } from './DashboardSecondaryStats';
import { DashboardStatusPieChart } from './DashboardStatusPieChart';
import { DashboardWelcome } from './DashboardWelcome';

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

  const recentOrders = useMemo(() => recentOrdersLast7Days(orders), [orders]);
  const activeRoutes = useMemo(
    () =>
      routes.filter(
        (r) => r.status === 'not_started' || r.status === 'in_progress',
      ),
    [routes],
  );

  const [activeRoutesPage, setActiveRoutesPage] = useState(1);
  const activeRoutesTotalPages = Math.max(
    1,
    Math.ceil(activeRoutes.length / ACTIVE_ROUTES_PAGE_SIZE),
  );
  const paginatedActiveRoutes = useMemo(() => {
    const start = (activeRoutesPage - 1) * ACTIVE_ROUTES_PAGE_SIZE;
    return activeRoutes.slice(start, start + ACTIVE_ROUTES_PAGE_SIZE);
  }, [activeRoutes, activeRoutesPage]);

  useEffect(() => {
    setActiveRoutesPage((p) => Math.min(p, activeRoutesTotalPages));
  }, [activeRoutes.length, activeRoutesTotalPages]);

  const routeStatusRows = useMemo(() => buildRouteStatusBreakdown(routes), [routes]);
  const orderStatusRows = useMemo(
    () => buildOrderStatusBreakdown(orders, tenant),
    [orders, tenant],
  );

  const effectiveStatusChart = useMemo(() => {
    if (statusChart.length > 0) return enrichStatusChartPoints(statusChart);
    return orderStatusToChartPoints(orders, tenant);
  }, [statusChart, orders, tenant]);

  const effectiveOrdersChart = useMemo(() => {
    if (ordersChart.length > 0) return ordersChart;
    return buildOrdersWeeklyChart(orders);
  }, [ordersChart, orders]);

  const kpis = useMemo(
    () =>
      mergeDashboardStats(
        stats,
        computeDashboardKpis(orders, routes, clients.length),
      ),
    [stats, orders, routes, clients.length],
  );

  const ordersTotalSubtitle = useMemo(() => kpiOrdersTotalSubtitle(orders), [orders]);

  const hasOrdersChart =
    ordersChart.length > 0 ||
    ordersWeeklyChartHasActivity(effectiveOrdersChart) ||
    orders.length > 0;
  const hasStatusChart = effectiveStatusChart.some((p) => p.value > 0);
  const ordersChartWeekEmpty =
    orders.length > 0 && !ordersWeeklyChartHasActivity(effectiveOrdersChart);

  if (isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }

  return (
    <div className="space-y-6">
      <DashboardWelcome userName={user?.name.split(' ')[0] ?? ''} />

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

      <DashboardSecondaryStats
        activeRoutes={kpis.activeRoutes}
        totalClients={kpis.totalClients}
        deliveryRate={kpis.deliveryRate}
        avgDeliveryTime={kpis.avgDeliveryTime}
      />

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
        <DashboardOrdersChart
          data={effectiveOrdersChart}
          hasOrdersChart={hasOrdersChart}
          ordersChartWeekEmpty={ordersChartWeekEmpty}
          ordersCount={orders.length}
        />
        <DashboardStatusPieChart
          data={effectiveStatusChart}
          hasStatusChart={hasStatusChart}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardRecentOrders
          recentOrders={recentOrders}
          onViewRoutes={() => navigate('/rutas')}
        />
        <DashboardActiveRoutes
          activeRoutes={activeRoutes}
          paginatedRoutes={paginatedActiveRoutes}
          activeRoutesPage={activeRoutesPage}
          activeRoutesTotalPages={activeRoutesTotalPages}
          orders={orders}
          onPageChange={setActiveRoutesPage}
          onViewRoutes={() => navigate('/rutas')}
        />
      </div>
    </div>
  );
}
