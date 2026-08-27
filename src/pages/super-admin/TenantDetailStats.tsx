import { Package, Shield, Truck, Users } from 'lucide-react';

type TenantStats = {
  user_count: number;
  order_count: number;
  route_count: number;
  vehicle_count: number;
};

export function TenantDetailStats({ stats }: { stats: TenantStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-violet-600 dark:text-violet-400" />
          <p className="text-xs text-stone-400">Usuarios</p>
        </div>
        <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{stats.user_count}</p>
      </div>
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Package size={16} className="text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-stone-400">Pedidos</p>
        </div>
        <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{stats.order_count}</p>
      </div>
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Truck size={16} className="text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs text-stone-400">Rutas</p>
        </div>
        <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{stats.route_count}</p>
      </div>
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-blue-600 dark:text-blue-400" />
          <p className="text-xs text-stone-400">Vehículos</p>
        </div>
        <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{stats.vehicle_count}</p>
      </div>
    </div>
  );
}
