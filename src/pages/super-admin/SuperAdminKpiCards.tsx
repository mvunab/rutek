import {
  ArrowUpRight, Building2, CheckCircle2, Minus, Package, Truck, Users,
} from 'lucide-react';

type Stats = {
  total_tenants?: number;
  active_tenants?: number;
  total_users?: number;
  total_orders?: number;
  total_routes?: number;
};

type SystemHealth = {
  avg_users_per_tenant?: number;
  avg_orders_per_tenant?: number;
  active_rate?: number;
};

export function SuperAdminKpiCards({
  stats,
  health,
}: {
  stats: Stats | null;
  health: SystemHealth | undefined;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
          {stats && stats.total_tenants! > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 size={12} />{stats.active_tenants} activos</span>
          )}
        </div>
        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats?.total_tenants || 0}</p>
        <p className="text-xs text-stone-400">Total Tenants</p>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Users size={18} className="text-violet-600 dark:text-violet-400" />
          {health && (
            <span className="text-xs text-stone-400">{health.avg_users_per_tenant}/tenant</span>
          )}
        </div>
        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats?.total_users || 0}</p>
        <p className="text-xs text-stone-400">Usuarios Totales</p>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Package size={18} className="text-amber-600 dark:text-amber-400" />
          {health && (
            <span className="text-xs text-stone-400">{health.avg_orders_per_tenant}/tenant</span>
          )}
        </div>
        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats?.total_orders || 0}</p>
        <p className="text-xs text-stone-400">Pedidos Globales</p>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Truck size={18} className="text-emerald-600 dark:text-emerald-400" />
          {health && (
            <span className={`flex items-center gap-1 text-xs ${health.active_rate! >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {health.active_rate! >= 80 ? <ArrowUpRight size={12} /> : <Minus size={12} />}
              {health.active_rate}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats?.total_routes || 0}</p>
        <p className="text-xs text-stone-400">Rutas Globales</p>
      </div>
    </div>
  );
}
